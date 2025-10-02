#!/bin/sh
podman exec -it mssql /opt/mssql-tools18/bin/sqlcmd -S localhost -U SA -P 'Str0ng!Passw0rd' -C -Q "CREATE DATABASE BrokerTEC;"
podman exec -it mssql /opt/mssql-tools18/bin/sqlcmd -S localhost -U SA -P 'Str0ng!Passw0rd' -C -d BrokerTEC -i /mnt/schema.sql
podman exec -it mssql /opt/mssql-tools18/bin/sqlcmd -S localhost -U SA -P 'Str0ng!Passw0rd' -C -d BrokerTEC -i /mnt/seed.sql
