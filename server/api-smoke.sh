#!/usr/bin/env bash
set -euo pipefail
API="${1:-http://127.0.0.1:3001}"

echo "GET /users"
curl -s "$API/users?page=1&pageSize=3" | jq '{len: (.items|length), total, totalPages}'

echo -e "\nSearch (ivan)"
curl -s "$API/users?page=1&pageSize=5&search=ivan" | jq '.items | map(.name)'

# Создаём уникального пользователя
EMAIL="test+smoke-$(date +%s)@example.com"
NEW=$(curl -s -X POST "$API/users" -H 'Content-Type: application/json' \
  -d "{\"name\":\"Тест Тестов\",\"email\":\"$EMAIL\",\"group\":\"HR\"}")
echo -e "\nPOST /users -> created"
echo "$NEW" | jq

NEW_ID=$(echo "$NEW" | jq -r '.id')

echo -e "\nGET /users/$NEW_ID"
curl -s "$API/users/$NEW_ID" | jq

echo -e "\nPATCH /users/$NEW_ID (group=Маркетинг)"
curl -s -X PATCH "$API/users/$NEW_ID" -H 'Content-Type: application/json' \
  -d '{"group":"Маркетинг"}' | jq

echo -e "\nGET /groups"
curl -s "$API/groups" | jq

