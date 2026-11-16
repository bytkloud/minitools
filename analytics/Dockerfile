FROM golang:1.26-alpine AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY main.go .
RUN CGO_ENABLED=0 go build -ldflags="-s -w" -o /stats .

FROM alpine:3
COPY --from=build /stats /stats
VOLUME /data
ENV STATS_DB=/data/stats.db
EXPOSE 8081
CMD ["/stats"]
