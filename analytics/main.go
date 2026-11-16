package main

import (
	"crypto/sha256"
	"crypto/subtle"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"html/template"
	"log"
	"net"
	"net/http"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"
	_ "time/tzdata"

	_ "modernc.org/sqlite"
)

var (
	db     *sql.DB
	secret = env("STATS_SECRET", "change-me")
	user   = env("STATS_USER", "admin")
	pass   = os.Getenv("STATS_PASSWORD")
	loc    *time.Location
)

func env(k, d string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return d
}

func main() {
	if pass == "" {
		log.Fatal("STATS_PASSWORD is required")
	}
	var err error
	if loc, err = time.LoadLocation(env("STATS_TZ", "UTC")); err != nil {
		log.Fatal(err)
	}
	db, err = sql.Open("sqlite", env("STATS_DB", "stats.db")+"?_pragma=journal_mode(WAL)&_pragma=busy_timeout(5000)")
	if err != nil {
		log.Fatal(err)
	}
	db.SetMaxOpenConns(1)
	if _, err = db.Exec(`CREATE TABLE IF NOT EXISTS events (
		id INTEGER PRIMARY KEY,
		ts INTEGER NOT NULL,
		type TEXT NOT NULL,
		path TEXT NOT NULL,
		tool TEXT NOT NULL DEFAULT '',
		format TEXT NOT NULL DEFAULT '',
		visitor TEXT NOT NULL,
		referrer TEXT NOT NULL DEFAULT '',
		device TEXT NOT NULL DEFAULT ''
	);
	CREATE INDEX IF NOT EXISTS events_ts ON events(ts);`); err != nil {
		log.Fatal(err)
	}

	mux := http.NewServeMux()
	mux.HandleFunc("POST /api/e", collect)
	mux.HandleFunc("GET /{$}", auth(dashboard))
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, _ *http.Request) { w.Write([]byte("ok")) })
	addr := env("STATS_ADDR", ":8081")
	log.Println("listening on", addr)
	log.Fatal(http.ListenAndServe(addr, mux))
}

// ---- collection ----

type payload struct {
	Type   string `json:"type"`
	Path   string `json:"path"`
	Tool   string `json:"tool"`
	Format string `json:"format"`
	Ref    string `json:"ref"`
}

var (
	rlMu sync.Mutex
	rl   = map[string][]time.Time{}
)

func limited(key string) bool {
	rlMu.Lock()
	defer rlMu.Unlock()
	now := time.Now()
	recent := rl[key][:0]
	for _, t := range rl[key] {
		if now.Sub(t) < time.Minute {
			recent = append(recent, t)
		}
	}
	recent = append(recent, now)
	rl[key] = recent
	if len(rl) > 10000 {
		rl = map[string][]time.Time{}
	}
	return len(recent) > 60
}

func clientIP(r *http.Request) string {
	if xf := r.Header.Get("X-Forwarded-For"); xf != "" {
		return strings.TrimSpace(strings.Split(xf, ",")[0])
	}
	h, _, _ := net.SplitHostPort(r.RemoteAddr)
	return h
}

func device(ua string) string {
	l := strings.ToLower(ua)
	switch {
	case strings.Contains(l, "ipad") || strings.Contains(l, "tablet"):
		return "tablet"
	case strings.Contains(l, "mobi") || strings.Contains(l, "android") || strings.Contains(l, "iphone"):
		return "mobile"
	}
	return "desktop"
}

func isBot(ua string) bool {
	l := strings.ToLower(ua)
	if l == "" {
		return true
	}
	for _, b := range []string{"bot", "crawl", "spider", "curl", "wget", "python", "headless", "lighthouse", "monitor", "uptime", "preview"} {
		if strings.Contains(l, b) {
			return true
		}
	}
	return false
}

func clip(s string, n int) string {
	if len(s) > n {
		return s[:n]
	}
	return s
}

func collect(w http.ResponseWriter, r *http.Request) {
	defer w.WriteHeader(http.StatusNoContent)
	ua := r.UserAgent()
	if isBot(ua) {
		return
	}
	var p payload
	if json.NewDecoder(http.MaxBytesReader(w, r.Body, 2048)).Decode(&p) != nil {
		return
	}
	if p.Type != "pageview" && p.Type != "download" {
		return
	}
	ip := clientIP(r)
	if limited(ip) {
		return
	}
	// daily-rotating salt: visitors can't be tracked across days, no raw IPs stored
	day := time.Now().In(loc).Format("2006-01-02")
	sum := sha256.Sum256([]byte(secret + day + ip + ua))
	visitor := hex.EncodeToString(sum[:8])
	db.Exec(`INSERT INTO events (ts,type,path,tool,format,visitor,referrer,device) VALUES (?,?,?,?,?,?,?,?)`,
		time.Now().Unix(), p.Type, clip(p.Path, 200), clip(p.Tool, 60), clip(p.Format, 20), visitor, clip(p.Ref, 100), device(ua))
}

// ---- dashboard ----

func auth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		u, p, ok := r.BasicAuth()
		if !ok || subtle.ConstantTimeCompare([]byte(u), []byte(user)) != 1 || subtle.ConstantTimeCompare([]byte(p), []byte(pass)) != 1 {
			w.Header().Set("WWW-Authenticate", `Basic realm="stats"`)
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}
		next(w, r)
	}
}

type row struct {
	Label string
	N     int
	Pct   int // bar width relative to max in the list
}

type view struct {
	Days                                                        int
	Pageviews, Visitors, Downloads, DownloaderVisitors, Engaged int
	Daily, Hourly, Weekday, Pages, Devices, Refs                []row
	ToolDL                                                      []toolRow
}

type toolRow struct {
	Tool         string
	Views, Users int
	DocX, PDF    int
	Downloaders  int
}

func withPct(rs []row) []row {
	max := 1
	for _, r := range rs {
		if r.N > max {
			max = r.N
		}
	}
	for i := range rs {
		rs[i].Pct = rs[i].N * 100 / max
	}
	return rs
}

func rows(q string, args ...any) []row {
	rs, err := db.Query(q, args...)
	if err != nil {
		log.Println(err)
		return nil
	}
	defer rs.Close()
	var out []row
	for rs.Next() {
		var r row
		rs.Scan(&r.Label, &r.N)
		out = append(out, r)
	}
	return withPct(out)
}

func dashboard(w http.ResponseWriter, r *http.Request) {
	days, _ := strconv.Atoi(r.URL.Query().Get("days"))
	if days <= 0 || days > 365 {
		days = 30
	}
	now := time.Now().In(loc)
	since := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, loc).AddDate(0, 0, -(days - 1)).Unix()
	_, off := now.Zone()
	o := strconv.Itoa(off) // shift UTC epoch to local for grouping

	v := view{Days: days}
	db.QueryRow(`SELECT COUNT(*) FROM events WHERE ts>=? AND type='pageview'`, since).Scan(&v.Pageviews)
	db.QueryRow(`SELECT COUNT(*) FROM events WHERE ts>=? AND type='download'`, since).Scan(&v.Downloads)
	// visitor hashes rotate daily, so "visitors" = distinct visitor-days summed over the range
	db.QueryRow(`SELECT COUNT(*) FROM (SELECT DISTINCT date(ts+`+o+`,'unixepoch'), visitor FROM events WHERE ts>=?)`, since).Scan(&v.Visitors)
	db.QueryRow(`SELECT COUNT(*) FROM (SELECT DISTINCT date(ts+`+o+`,'unixepoch'), visitor FROM events WHERE ts>=? AND type='download')`, since).Scan(&v.DownloaderVisitors)
	// engaged = visit-days with >1 distinct page or any export
	db.QueryRow(`SELECT COUNT(*) FROM (SELECT 1 FROM events WHERE ts>=? GROUP BY date(ts+`+o+`,'unixepoch'), visitor
		HAVING COUNT(DISTINCT path)>1 OR SUM(type='download')>0)`, since).Scan(&v.Engaged)

	v.Daily = rows(`SELECT d, COUNT(DISTINCT visitor) FROM (SELECT date(ts+`+o+`,'unixepoch') d, visitor FROM events WHERE ts>=?) GROUP BY d ORDER BY d`, since)
	v.Hourly = rows(`SELECT printf('%02d:00', (ts+`+o+`)%86400/3600) h, COUNT(*) FROM events WHERE ts>=? AND type='pageview' GROUP BY h ORDER BY h`, since)
	v.Weekday = rows(`SELECT CASE strftime('%w', ts+`+o+`,'unixepoch') WHEN '0' THEN 'Sun' WHEN '1' THEN 'Mon' WHEN '2' THEN 'Tue' WHEN '3' THEN 'Wed' WHEN '4' THEN 'Thu' WHEN '5' THEN 'Fri' ELSE 'Sat' END, COUNT(*) FROM events WHERE ts>=? AND type='pageview' GROUP BY strftime('%w', ts+`+o+`,'unixepoch') ORDER BY strftime('%w', ts+`+o+`,'unixepoch')`, since)
	v.Pages = rows(`SELECT path, COUNT(*) c FROM events WHERE ts>=? AND type='pageview' GROUP BY path ORDER BY c DESC LIMIT 20`, since)
	v.Devices = rows(`SELECT device, COUNT(*) c FROM events WHERE ts>=? AND type='pageview' GROUP BY device ORDER BY c DESC`, since)
	v.Refs = rows(`SELECT CASE WHEN referrer='' THEN '(direct)' ELSE referrer END, COUNT(*) c FROM events WHERE ts>=? AND type='pageview' GROUP BY 1 ORDER BY c DESC LIMIT 10`, since)

	// per-tool funnel: the paywall-decision table
	trs, err := db.Query(`SELECT t, SUM(pv), COUNT(DISTINCT CASE WHEN pv=1 THEN dv END), SUM(dx), SUM(dp), COUNT(DISTINCT CASE WHEN dl=1 THEN dv END) FROM (
		SELECT CASE WHEN tool<>'' THEN tool ELSE trim(path,'/') END t,
			date(ts+`+o+`,'unixepoch')||visitor dv,
			type='pageview' pv, type='download' dl, (type='download' AND format='docx') dx, (type='download' AND format='pdf') dp
		FROM events WHERE ts>=?) WHERE t<>'' GROUP BY t ORDER BY SUM(pv) DESC`, since)
	if err == nil {
		defer trs.Close()
		for trs.Next() {
			var t toolRow
			trs.Scan(&t.Tool, &t.Views, &t.Users, &t.DocX, &t.PDF, &t.Downloaders)
			v.ToolDL = append(v.ToolDL, t)
		}
	}
	tpl.Execute(w, v)
}

var tpl = template.Must(template.New("d").Funcs(template.FuncMap{
	"pct": func(a, b int) string {
		if b == 0 {
			return "–"
		}
		return strconv.Itoa(a*100/b) + "%"
	},
}).Parse(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>minitools stats</title><style>
body{font:14px system-ui,sans-serif;margin:0;background:#f6f7f9;color:#1a1d21}
main{max-width:1000px;margin:0 auto;padding:24px 16px}
h1{font-size:20px;margin:0 0 4px}h2{font-size:13px;text-transform:uppercase;letter-spacing:.05em;color:#667;margin:0 0 10px}
nav a{margin-right:10px;color:#2563eb;text-decoration:none}nav a.on{font-weight:700;text-decoration:underline}
.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin:16px 0}
.card,.box{background:#fff;border-radius:8px;padding:14px;box-shadow:0 1px 2px #0001}
.card b{display:block;font-size:26px}.card span{color:#667;font-size:12px}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:12px;margin-bottom:12px}
.r{display:grid;grid-template-columns:110px 1fr 40px;gap:8px;align-items:center;margin:3px 0;font-size:13px}
.r .l{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.bar{background:#2563eb;height:10px;border-radius:3px}
table{width:100%;border-collapse:collapse}th,td{text-align:right;padding:6px 8px;border-bottom:1px solid #eee}th:first-child,td:first-child{text-align:left}
th{font-size:12px;color:#667}.note{color:#667;font-size:12px;margin-top:8px}
</style></head><body><main>
<h1>minitools stats</h1>
<nav><a href="?days=7" {{if eq .Days 7}}class="on"{{end}}>7d</a><a href="?days=30" {{if eq .Days 30}}class="on"{{end}}>30d</a><a href="?days=90" {{if eq .Days 90}}class="on"{{end}}>90d</a><a href="?days=365" {{if eq .Days 365}}class="on"{{end}}>1y</a></nav>
<div class="cards">
<div class="card"><b>{{.Visitors}}</b><span>visitor-days (unique per day)</span></div>
<div class="card"><b>{{.Pageviews}}</b><span>page views</span></div>
<div class="card"><b>{{.Downloads}}</b><span>downloads / prints</span></div>
<div class="card"><b>{{pct .DownloaderVisitors .Visitors}}</b><span>visitors who exported</span></div>
<div class="card"><b>{{pct .Engaged .Visitors}}</b><span>engaged (&gt;1 page or exported)</span></div>
</div>
<div class="box" style="margin-bottom:12px"><h2>Per tool — paywall candidates</h2><table>
<tr><th>Tool</th><th>Views</th><th>Visitor-days</th><th>DOCX</th><th>PDF</th><th>Exporters</th><th>Export rate</th></tr>
{{range .ToolDL}}<tr><td>{{.Tool}}</td><td>{{.Views}}</td><td>{{.Users}}</td><td>{{.DocX}}</td><td>{{.PDF}}</td><td>{{.Downloaders}}</td><td>{{pct .Downloaders .Users}}</td></tr>{{end}}
</table><div class="note">Visitor identity rotates daily (privacy), so a person returning on 3 days counts as 3 visitor-days. Exporters / visitor-days = share of visits that ended in a DOCX or PDF.</div></div>
<div class="grid">
<div class="box"><h2>Visitors per day</h2>{{template "bars" .Daily}}</div>
<div class="box"><h2>Hour of day</h2>{{template "bars" .Hourly}}</div>
<div class="box"><h2>Day of week</h2>{{template "bars" .Weekday}}</div>
<div class="box"><h2>Top pages</h2>{{template "bars" .Pages}}</div>
<div class="box"><h2>Devices</h2>{{template "bars" .Devices}}</div>
<div class="box"><h2>Referrers</h2>{{template "bars" .Refs}}</div>
</div></main></body></html>
{{define "bars"}}{{range .}}<div class="r"><span class="l" title="{{.Label}}">{{.Label}}</span><div><div class="bar" style="width:{{.Pct}}%"></div></div><span>{{.N}}</span></div>{{else}}<div class="note">No data yet</div>{{end}}{{end}}`))
