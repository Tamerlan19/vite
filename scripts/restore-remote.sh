#!/usr/bin/env bash
set -euo pipefail
[[ -f .remote.env ]] && source .remote.env

HOST=${REMOTE_HOST:?}
USER=${REMOTE_USER:?}
PORT=${REMOTE_PORT:-22}
DIR=${REMOTE_DIR:-~/server}
FILE=${1:-backup.json}      # можно передать путь к локальному .json первым аргументом
PM2=${PM2_NAME:-}

SSH="ssh -p $PORT"
SCP="scp -P $PORT"

# если передали локальный путь, зальём его на сервер в $DIR/backup.json
if [[ -f "$FILE" ]]; then
  echo "→ uploading local $FILE to $HOST:$DIR/backup.json"
  $SCP "$FILE" "$USER@$HOST:$DIR/backup.json"
  REMOTE_JSON="backup.json"
else
  # иначе считаем, что на сервере уже лежит $FILE
  REMOTE_JSON="$FILE"
fi

# остановим pm2, если задано имя
if [[ -n "$PM2" ]]; then
  $SSH "$USER@$HOST" "pm2 stop '$PM2' || true"
fi

echo "→ SSH $USER@$HOST: restore from $DIR/$REMOTE_JSON"
$SSH "$USER@$HOST" "cd '$DIR' && npm run restore -- '$REMOTE_JSON'"

# поднимем обратно
if [[ -n "$PM2" ]]; then
  $SSH "$USER@$HOST" "pm2 start '$PM2' || true"
fi

echo "✓ Restore done"
