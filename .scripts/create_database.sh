#!/bin/sh
DATABASE=${1:-civicdr_test}
psql -c "create database $DATABASE" -U postgres
