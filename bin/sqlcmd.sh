#!/bin/sh
podman exec -it brokertec_mssql_1 /opt/mssql-tools18/bin/sqlcmd -S localhost -U SA -P 'Str0ng!Passw0rd' -C -d BrokerTEC "$@"
