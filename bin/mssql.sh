#!/bin/sh
podman run -e 'ACCEPT_EULA=Y' \
           -e 'SA_PASSWORD=Str0ng!Passw0rd' \
           -p 1433:1433 \
           -v .mssql:/mnt:Z \
           --name mssql \
           -d mcr.microsoft.com/mssql/server:2022-latest
