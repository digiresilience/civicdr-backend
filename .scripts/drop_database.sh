#!/bin/sh
DATABASE=${1:-civicdr_test}
psql -c "drop database ${DATABASE}" -U postgres
