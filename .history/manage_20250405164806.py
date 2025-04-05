#!/usr/bin/env python3
import argparse
import os
import signal
import subprocess
import sys
import time
from typing import Optional, Tuple

import psutil
import requests
from rich.console import Console
from rich.panel import Panel
from rich.table import Table

console = Console()

class AppManager:
    def __init__(self):
        self.base_dir = os.path.dirname(os.path.abspath(__file__))
        self.server_dir = os.path.join(self.base_dir, 'server')
        self.client_dir = os.path.join(self.base_dir, 'client')
        self.server_port = 5000
        self.client_port = 5173
        self.server_process = None
        self.client_process = None
        self.mongodb_port = 27017

    def _is_port_in_use(self, port: int) -> bool:
        """Check if a port is in use."""
        for conn in psutil.net_connections():
            if conn.laddr.port == port:
                return True
        return False

    def _wait_for_port(self, port: int, timeout: int = 30) -> bool:
        """Wait for a port to become available."""
        start_time = time.time()
        while time.time() - start_time < timeout:
            if self._is_port_in_use(port):
                return True
            time.sleep(1)
        return False

    def _run_command(self, command: str, cwd: str, env: Optional[dict] = None) -> subprocess.Popen:
        """Run a command in the specified directory."""
        if env is None:
            env = os.environ.copy()
        
        return subprocess.Popen(
            command.split(),
            cwd=cwd,
            env=env,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            universal_newlines=True
        )

    def check_mongodb(self) -> bool:
        """Check if MongoDB is running."""
        try:
            return self._is_port_in_use(self.mongodb_port)
        except:
            return False

    def start_mongodb(self) -> None:
        """Start MongoDB if it's not running."""
        if not self.check_mongodb():
            try:
                subprocess.run(['brew', 'services', 'start', 'mongodb/brew/mongodb-community@7.0'])
                console.print("[green]MongoDB started successfully[/green]")
            except Exception as e:
                console.print(f"[red]Failed to start MongoDB: {str(e)}[/red]")
                sys.exit(1)

    def start(self) -> None:
        """Start both server and client applications."""
        # Check and start MongoDB first
        if not self.check_mongodb():
            console.print("[yellow]MongoDB is not running. Starting MongoDB...[/yellow]")
            self.start_mongodb()
            time.sleep(2)  # Give MongoDB time to start

        # Start server
        if not self._is_port_in_use(self.server_port):
            console.print("[yellow]Starting server...[/yellow]")
            self.server_process = self._run_command('npm run dev', self.server_dir)
            if self._wait_for_port(self.server_port):
                console.print("[green]Server started successfully[/green]")
            else:
                console.print("[red]Failed to start server[/red]")
                return

        # Start client
        if not self._is_port_in_use(self.client_port):
            console.print("[yellow]Starting client...[/yellow]")
            self.client_process = self._run_command('npm run dev', self.client_dir)
            if self._wait_for_port(self.client_port):
                console.print("[green]Client started successfully[/green]")
            else:
                console.print("[red]Failed to start client[/red]")
                return

        console.print("[green]All services are running![/green]")

    def stop(self) -> None:
        """Stop both server and client applications."""
        def kill_process_on_port(port: int) -> None:
            for proc in psutil.process_iter(['pid', 'name', 'connections']):
                try:
                    for conn in proc.connections():
                        if conn.laddr.port == port:
                            os.kill(proc.pid, signal.SIGTERM)
                            break
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    pass

        kill_process_on_port(self.server_port)
        kill_process_on_port(self.client_port)
        console.print("[green]All services stopped[/green]")

    def restart(self) -> None:
        """Restart both server and client applications."""
        console.print("[yellow]Restarting services...[/yellow]")
        self.stop()
        time.sleep(2)  # Wait for processes to fully stop
        self.start()

    def status(self) -> None:
        """Check the status of all services."""
        table = Table(title="VIP Transaction Tracker Status")
        table.add_column("Service", style="cyan")
        table.add_column("Status", style="green")
        table.add_column("Port", style="yellow")

        # Check MongoDB
        mongodb_status = "Running" if self.check_mongodb() else "Stopped"
        table.add_row("MongoDB", mongodb_status, str(self.mongodb_port))

        # Check Server
        server_status = "Running" if self._is_port_in_use(self.server_port) else "Stopped"
        table.add_row("Server", server_status, str(self.server_port))

        # Check Client
        client_status = "Running" if self._is_port_in_use(self.client_port) else "Stopped"
        table.add_row("Client", client_status, str(self.client_port))

        console.print(table)

def main():
    parser = argparse.ArgumentParser(description='VIP Transaction Tracker Manager')
    parser.add_argument('action', choices=['start', 'stop', 'restart', 'status'],
                      help='Action to perform')

    args = parser.parse_args()
    manager = AppManager()

    try:
        if args.action == 'start':
            manager.start()
        elif args.action == 'stop':
            manager.stop()
        elif args.action == 'restart':
            manager.restart()
        elif args.action == 'status':
            manager.status()
    except KeyboardInterrupt:
        console.print("\n[yellow]Shutting down...[/yellow]")
        manager.stop()
    except Exception as e:
        console.print(f"[red]Error: {str(e)}[/red]")
        sys.exit(1)

if __name__ == '__main__':
    main() 