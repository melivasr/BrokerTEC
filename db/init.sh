#!/bin/sh
set -e
/opt/mssql-tools18/bin/sqlcmd -S localhost -U SA -P 'Str0ng!Passw0rd' -C -Q "DROP DATABASE IF EXISTS BrokerTEC; CREATE DATABASE BrokerTEC;"
/opt/mssql-tools18/bin/sqlcmd -S localhost -U SA -P 'Str0ng!Passw0rd' -C -d BrokerTEC -i /db/schema.sql
/opt/mssql-tools18/bin/sqlcmd -S localhost -U SA -P 'Str0ng!Passw0rd' -C -d BrokerTEC -i /db/seed.sql
