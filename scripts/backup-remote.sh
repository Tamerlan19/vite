#!/usr/bin/env bash
set -euo pipefail

# читаем конфиг
[[ -f .remote.env ]] && source .remote.env

HOST=${REMOTE_HOST:?REMOTE_HOST is required}
USER=${REMOTE_USER:?REMOTE_USER is required}
PORT=${REMOTE_PORT:-22}
DIR=${REMOTE_DIR:-~/server}
FILE=${BACKUP_FILE:-backup.json}

SSH="ssh -p $PORT"
SCP="scp -P $PORT"

echo "→ SSH $USER@$HOST: backup to $DIR/$FILE"
$SSH "$USER@$HOST" "cd '$DIR' && npm run backup -- '$FILE'"

# если хочешь сразу забрать файл локально — запусти с DOWNLOAD=1
if [[ "${DOWNLOAD:-0}" == "1" ]]; then
  mkdir -p server
  echo "→ downloading $FILE to ./server/$FILE"
  $SCP "$USER@$HOST:$DIR/$FILE" "./server/$FILE"
fi

echo "✓ Backup finished at $HOST:$DIR/$FILE"

