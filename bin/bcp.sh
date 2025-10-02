#!/bin/sh
podman exec -it mssql /opt/mssql-tools/bin/bcp "$@"

