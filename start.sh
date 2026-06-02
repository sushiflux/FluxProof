#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════
#  FluxProof – Dev Start Script
#  Startet Backend (ASP.NET Core 10) + Frontend (Vite/React)
# ══════════════════════════════════════════════════════════════

# ── Farben & Symbole ──────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
WHITE='\033[1;37m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

OK="${GREEN}✓${NC}"
FAIL="${RED}✗${NC}"
WARN="${YELLOW}⚠${NC}"
INFO="${CYAN}ℹ${NC}"
ARROW="${MAGENTA}▶${NC}"

# ── Pfade & Konfiguration ─────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONTAINER_NAME="FluxProof-Postgres"
API_PROJECT="$SCRIPT_DIR/src/FluxProof.API/FluxProof.API.csproj"
FRONTEND_DIR="$SCRIPT_DIR/frontend"
API_LOG="/tmp/fluxproof-api.log"
FE_LOG="/tmp/fluxproof-fe.log"

DEFAULT_API_PORT=5225
DEFAULT_FE_PORT=5173

API_PORT=$DEFAULT_API_PORT
FE_PORT=$DEFAULT_FE_PORT
API_PID=""
FE_PID=""
CLEANUP_DONE=0

# ── .NET Umgebung ─────────────────────────────────────────────
export DOTNET_ROOT="$HOME/.dotnet"
export PATH="$HOME/.dotnet:$HOME/.dotnet/tools:$PATH"
export DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=1
export ASPNETCORE_ENVIRONMENT=Development

# ══════════════════════════════════════════════════════════════
# Hilfsfunktionen
# ══════════════════════════════════════════════════════════════

divider() {
  echo -e "  ${DIM}────────────────────────────────────────────────${NC}"
}

section() {
  echo ""
  echo -e "  ${BOLD}${WHITE}$1${NC}"
  divider
}

log_ok()   { echo -e "  $OK  $1"; }
log_fail() { echo -e "  $FAIL  $1"; }
log_warn() { echo -e "  $WARN  $1"; }
log_info() { echo -e "  $INFO  $1"; }
log_step() { echo -e "  $ARROW  ${BOLD}$1${NC}"; }

# Prüft ob ein Port frei ist
port_free() {
  ! ss -tlnp 2>/dev/null | grep -q ":$1 "
}

# Findet den nächsten freien Port ab $1
next_free_port() {
  local p=$1
  while ! port_free $p; do ((p++)); done
  echo $p
}

# Beendet alle Prozesse die auf einem Port lauschen
kill_port() {
  local port=$1
  local pids
  pids=$(lsof -ti:"$port" 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo "$pids" | xargs kill -TERM 2>/dev/null || true
    sleep 1
    pids=$(lsof -ti:"$port" 2>/dev/null || true)
    [ -n "$pids" ] && echo "$pids" | xargs kill -9 2>/dev/null || true
  fi
}

# Wartet bis ein Port lauscht (max. $2 Sekunden)
wait_for_port() {
  local port=$1
  local timeout=${2:-35}
  local waited=0
  printf "  ${DIM}Warte"
  while port_free "$port"; do
    sleep 1
    printf "."
    ((waited++))
    if [ $waited -ge $timeout ]; then
      printf "${NC}\n"
      return 1
    fi
  done
  printf "${NC}\n"
  return 0
}

# ── Cleanup beim Beenden ──────────────────────────────────────
cleanup() {
  [ $CLEANUP_DONE -eq 1 ] && return
  CLEANUP_DONE=1

  echo ""
  section "Beende alle Dienste"

  if [ -n "$FE_PID" ] && kill -0 "$FE_PID" 2>/dev/null; then
    kill "$FE_PID" 2>/dev/null || true
    wait "$FE_PID" 2>/dev/null || true
    log_ok "Frontend beendet  ${DIM}(PID $FE_PID)${NC}"
  fi

  if [ -n "$API_PID" ] && kill -0 "$API_PID" 2>/dev/null; then
    kill "$API_PID" 2>/dev/null || true
    wait "$API_PID" 2>/dev/null || true
    log_ok "Backend beendet   ${DIM}(PID $API_PID)${NC}"
  fi

  # Sicherheits-Cleanup falls PIDs nicht gesetzt waren
  kill_port "$API_PORT" 2>/dev/null || true
  kill_port "$FE_PORT"  2>/dev/null || true

  echo ""
  echo -e "  ${GREEN}${BOLD}Tschüss!${NC}"
  echo ""
}

trap cleanup EXIT SIGINT SIGTERM

# ══════════════════════════════════════════════════════════════
# Header
# ══════════════════════════════════════════════════════════════

clear
echo ""
echo -e "${BLUE}${BOLD}  ╔══════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}${BOLD}  ║           FluxProof  –  Dev Starter             ║${NC}"
echo -e "${BLUE}${BOLD}  ╚══════════════════════════════════════════════════╝${NC}"
echo ""

# ══════════════════════════════════════════════════════════════
# SCHRITT 1 – Docker Container prüfen
# ══════════════════════════════════════════════════════════════

section "1 / 4  Docker Container"

while true; do
  STATUS=$(docker inspect --format '{{.State.Status}}' "$CONTAINER_NAME" 2>/dev/null || echo "not_found")

  if [ "$STATUS" = "running" ]; then
    log_ok "${BOLD}$CONTAINER_NAME${NC}${GREEN} läuft"
    break

  elif [ "$STATUS" = "not_found" ]; then
    log_fail "Container ${BOLD}$CONTAINER_NAME${NC}${RED} nicht gefunden"
    echo ""
    echo -e "  ${YELLOW}Starte ihn mit:${NC}"
    echo -e "  ${DIM}    cd $SCRIPT_DIR${NC}"
    echo -e "  ${DIM}    docker compose up -d${NC}"
    echo ""
    read -rp "$(echo -e "  Drücke ${BOLD}[Enter]${NC} nachdem der Container gestartet ist…") "

  else
    log_warn "Container ${BOLD}$CONTAINER_NAME${NC}${YELLOW} ist ${BOLD}$STATUS${NC}"
    echo ""
    echo -e "  ${YELLOW}Starte ihn mit:${NC}"
    echo -e "  ${DIM}    docker start $CONTAINER_NAME${NC}"
    echo ""
    read -rp "$(echo -e "  Drücke ${BOLD}[Enter]${NC} nachdem der Container läuft…") "
  fi
done

# ══════════════════════════════════════════════════════════════
# SCHRITT 2 – Ports prüfen
# ══════════════════════════════════════════════════════════════

section "2 / 4  Port-Prüfung"

# API-Port
if port_free $API_PORT; then
  log_ok "API-Port      ${BOLD}$API_PORT${NC}${GREEN} frei"
else
  log_warn "API-Port      ${BOLD}$API_PORT${NC}${YELLOW} belegt – versuche zu beenden…"
  kill_port $API_PORT
  sleep 1
  if port_free $API_PORT; then
    log_ok "API-Port      ${BOLD}$API_PORT${NC}${GREEN} jetzt frei"
  else
    API_PORT=$(next_free_port $((DEFAULT_API_PORT + 1)))
    log_warn "API-Port      belegt → alternativer Port: ${BOLD}${YELLOW}$API_PORT${NC}"
  fi
fi

# Frontend-Port
if port_free $FE_PORT; then
  log_ok "Frontend-Port ${BOLD}$FE_PORT${NC}${GREEN} frei"
else
  log_warn "Frontend-Port ${BOLD}$FE_PORT${NC}${YELLOW} belegt – versuche zu beenden…"
  kill_port $FE_PORT
  sleep 1
  if port_free $FE_PORT; then
    log_ok "Frontend-Port ${BOLD}$FE_PORT${NC}${GREEN} jetzt frei"
  else
    FE_PORT=$(next_free_port $((DEFAULT_FE_PORT + 1)))
    log_warn "Frontend-Port belegt → alternativer Port: ${BOLD}${YELLOW}$FE_PORT${NC}"
  fi
fi

# ══════════════════════════════════════════════════════════════
# SCHRITT 3 – Backend starten
# ══════════════════════════════════════════════════════════════

section "3 / 4  Backend starten"

log_step "Starte ASP.NET Core 10 API auf Port $API_PORT"
echo ""

export ASPNETCORE_URLS="http://localhost:$API_PORT"

dotnet run \
  --project "$API_PROJECT" \
  --launch-profile http \
  > "$API_LOG" 2>&1 &
API_PID=$!

log_info "PID: $API_PID  |  Log: $API_LOG"

if wait_for_port $API_PORT 40; then
  log_ok "Backend läuft   ${DIM}→ http://localhost:$API_PORT${NC}"
else
  if ! kill -0 "$API_PID" 2>/dev/null; then
    log_fail "Backend-Prozess abgestürzt! Letzte Zeilen:"
    echo ""
    tail -20 "$API_LOG" | sed 's/^/    /'
    echo ""
    exit 1
  fi
  log_warn "Backend antwortet noch nicht (${DIM}Timeout${NC}${YELLOW}) – läuft weiter im Hintergrund"
fi

# ══════════════════════════════════════════════════════════════
# SCHRITT 4 – Frontend starten
# ══════════════════════════════════════════════════════════════

section "4 / 4  Frontend starten"

log_step "Starte Vite + React auf Port $FE_PORT"
echo ""

cd "$FRONTEND_DIR"
VITE_API_URL="http://localhost:$API_PORT" \
  npm run dev -- --port "$FE_PORT" --strictPort false \
  > "$FE_LOG" 2>&1 &
FE_PID=$!
cd "$SCRIPT_DIR"

log_info "PID: $FE_PID  |  Log: $FE_LOG"

if wait_for_port $FE_PORT 25; then
  log_ok "Frontend läuft  ${DIM}→ http://localhost:$FE_PORT${NC}"
else
  if ! kill -0 "$FE_PID" 2>/dev/null; then
    log_fail "Frontend-Prozess abgestürzt! Letzte Zeilen:"
    echo ""
    tail -20 "$FE_LOG" | sed 's/^/    /'
    echo ""
    exit 1
  fi
  log_warn "Frontend antwortet noch nicht (${DIM}Timeout${NC}${YELLOW}) – läuft weiter im Hintergrund"
fi

# ══════════════════════════════════════════════════════════════
# Status-Box
# ══════════════════════════════════════════════════════════════

echo ""
echo -e "${GREEN}${BOLD}  ╔══════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}${BOLD}  ║           FluxProof  läuft!  🚀                 ║${NC}"
echo -e "${GREEN}${BOLD}  ╠══════════════════════════════════════════════════╣${NC}"
printf  "${GREEN}${BOLD}  ║${NC}  %-46s${GREEN}${BOLD}║${NC}\n" ""
printf  "${GREEN}${BOLD}  ║${NC}  ${CYAN}${BOLD}Frontend:${NC}  %-37s${GREEN}${BOLD}║${NC}\n" "http://localhost:$FE_PORT"
printf  "${GREEN}${BOLD}  ║${NC}  ${BLUE}${BOLD}Backend: ${NC}  %-37s${GREEN}${BOLD}║${NC}\n" "http://localhost:$API_PORT"
printf  "${GREEN}${BOLD}  ║${NC}  %-46s${GREEN}${BOLD}║${NC}\n" ""
printf  "${GREEN}${BOLD}  ║${NC}  ${YELLOW}Login:${NC}     %-37s${GREEN}${BOLD}║${NC}\n" "admin/admin  (Admin-Panel)"
printf  "${GREEN}${BOLD}  ║${NC}  ${DIM}           %-37s${NC}${GREEN}${BOLD}║${NC}\n" "dev/dev      (beide Panels, nur DEV)"
printf  "${GREEN}${BOLD}  ║${NC}  %-46s${GREEN}${BOLD}║${NC}\n" ""
echo -e "${GREEN}${BOLD}  ╠══════════════════════════════════════════════════╣${NC}"
printf  "${GREEN}${BOLD}  ║${NC}  ${DIM}Logs:  tail -f /tmp/fluxproof-api.log${NC}         ${GREEN}${BOLD}║${NC}\n"
printf  "${GREEN}${BOLD}  ║${NC}  ${DIM}       tail -f /tmp/fluxproof-fe.log${NC}          ${GREEN}${BOLD}║${NC}\n"
printf  "${GREEN}${BOLD}  ║${NC}  %-46s${GREEN}${BOLD}║${NC}\n" ""
echo -e "${GREEN}${BOLD}  ╠══════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}${BOLD}  ║${NC}  ${RED}Ctrl+C${NC} zum Beenden aller Dienste               ${GREEN}${BOLD}║${NC}"
echo -e "${GREEN}${BOLD}  ╚══════════════════════════════════════════════════╝${NC}"
echo ""

# ══════════════════════════════════════════════════════════════
# Monitoring – wartet und zeigt an wenn ein Dienst abstürzt
# ══════════════════════════════════════════════════════════════

while true; do
  sleep 3

  if [ -n "$API_PID" ] && ! kill -0 "$API_PID" 2>/dev/null; then
    echo ""
    log_fail "${BOLD}Backend abgestürzt!${NC}${RED} (PID $API_PID)"
    log_info "Letzte Log-Zeilen ($API_LOG):"
    echo ""
    tail -15 "$API_LOG" | sed 's/^/    /'
    echo ""
    log_info "Drücke ${BOLD}Ctrl+C${NC} zum Beenden oder warte auf das Frontend."
    API_PID=""
  fi

  if [ -n "$FE_PID" ] && ! kill -0 "$FE_PID" 2>/dev/null; then
    echo ""
    log_fail "${BOLD}Frontend abgestürzt!${NC}${RED} (PID $FE_PID)"
    log_info "Letzte Log-Zeilen ($FE_LOG):"
    echo ""
    tail -15 "$FE_LOG" | sed 's/^/    /'
    echo ""
    FE_PID=""
  fi

  # Wenn beide weg sind, Skript beenden
  if [ -z "$API_PID" ] && [ -z "$FE_PID" ]; then
    log_warn "Alle Dienste beendet."
    break
  fi
done
