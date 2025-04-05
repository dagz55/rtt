#!/usr/bin/env python3
import os
import signal
import socket
import subprocess
import sys
import time
import traceback
import webbrowser  # Import webbrowser module
from typing import Any, Dict, Optional

import psutil
import requests
from rich.align import Align
from rich.console import Console
from rich.layout import Layout
from rich.live import Live
from rich.panel import Panel
from rich.prompt import Confirm, Prompt
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
        self.running = True

    def _is_port_in_use(self, port: int) -> Dict[str, Any]:
        """Check if a port is in use and return process information if found."""
        # First check with socket
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind(('localhost', port))
                s.close()
                return {"in_use": False}
            except socket.error:
                # Port is in use, try to get process info
                for proc in psutil.process_iter(['pid', 'name']):
                    try:
                        # Use net_connections instead of connections
                        connections = proc.net_connections()
                        for conn in connections:
                            if hasattr(conn, 'laddr') and conn.laddr.port == port:
                                return {
                                    "in_use": True,
                                    "pid": proc.pid,
                                    "name": proc.name(),
                                    "cmdline": proc.cmdline()
                                }
                    except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                        continue
                
                # Port is in use but couldn't get process info
                return {"in_use": True, "pid": None, "name": "Unknown"}

    def _handle_port_conflict(self, port: int, service_name: str) -> bool:
        """Handle port conflict by prompting user to kill the process or choose different port."""
        port_info = self._is_port_in_use(port)
        if not port_info["in_use"]:
            return True
        
        if "pid" in port_info and port_info["pid"]:
            console.print(f"[yellow]Port {port} is in use by {port_info['name']} (PID: {port_info['pid']})[/yellow]")
            if Confirm.ask("Do you want to stop the conflicting process?"):
                try:
                    os.kill(port_info["pid"], signal.SIGTERM)
                    time.sleep(2)  # Wait for process to terminate
                    return True
                except Exception as e:
                    console.print(f"[red]Failed to stop process: {str(e)}[/red]")
        else:
            console.print(f"[yellow]Port {port} is in use but process information is not available[/yellow]")
        
        if Confirm.ask("Would you like to try a different port?"):
            new_port = Prompt.ask("Enter new port number", default=str(port + 1))
            try:
                new_port = int(new_port)
                if service_name == 'server':
                    self.server_port = new_port
                elif service_name == 'client':
                    self.client_port = new_port
                return True
            except ValueError:
                console.print("[red]Invalid port number[/red]")
        
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
        
        # Split the command properly, handling quoted arguments
        if isinstance(command, str):
            import shlex
            command = shlex.split(command)
        
        return subprocess.Popen(
            command,
            cwd=cwd,
            env=env,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            universal_newlines=True,
            bufsize=1,  # Line buffered
            shell=False  # More secure, and we're already handling command splitting
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

    def stop_mongodb(self) -> None:
        """Stop MongoDB service."""
        try:
            subprocess.run(['brew', 'services', 'stop', 'mongodb/brew/mongodb-community@7.0'])
            console.print("[green]MongoDB stopped successfully[/green]")
        except Exception as e:
            console.print(f"[red]Failed to stop MongoDB: {str(e)}[/red]")

    def start(self, service: str = 'all') -> None:
        """Start services based on selection."""
        if service in ['all', 'mongodb']:
            if not self.check_mongodb():
                console.print("[yellow]MongoDB is not running. Starting MongoDB...[/yellow]")
                self.start_mongodb()
                time.sleep(2)

        if service in ['all', 'server']:
            port_info = self._is_port_in_use(self.server_port)
            if port_info["in_use"]:
                if not self._handle_port_conflict(self.server_port, 'server'):
                    console.print("[red]Cannot start server due to port conflict[/red]")
                    return
            
            console.print("[yellow]Starting server...[/yellow]")
            try:
                if not os.path.exists(os.path.join(self.server_dir, 'package.json')):
                    console.print("[red]Error: package.json not found in server directory[/red]")
                    return
                
                self.server_process = self._run_command('npm run dev', self.server_dir)
                if self._wait_for_port(self.server_port, timeout=60):
                    console.print(f"[green]Server started successfully on port {self.server_port}[/green]")
                else:
                    console.print("[red]Failed to start server: Timeout waiting for port[/red]")
                    if self.server_process:
                        self.server_process.terminate()
                    return
            except Exception as e:
                console.print(f"[red]Failed to start server: {str(e)}[/red]")
                if self.server_process:
                    self.server_process.terminate()
                return

        if service in ['all', 'client']:
            port_info = self._is_port_in_use(self.client_port)
            if port_info["in_use"]:
                if not self._handle_port_conflict(self.client_port, 'client'):
                    console.print("[red]Cannot start client due to port conflict[/red]")
                    return
            
            console.print("[yellow]Starting client...[/yellow]")
            try:
                if not os.path.exists(os.path.join(self.client_dir, 'package.json')):
                    console.print("[red]Error: package.json not found in client directory[/red]")
                    return
                
                if not os.path.exists(os.path.join(self.client_dir, 'node_modules')):
                    console.print("[yellow]Installing client dependencies...[/yellow]")
                    subprocess.run(['npm', 'install'], cwd=self.client_dir, check=True)
                
                # Update vite config if port was changed
                if self.client_port != 5173:
                    self._update_vite_config()
                
                self.client_process = self._run_command('npm run dev', self.client_dir)
                
                if self.client_process:
                    time.sleep(5)
                    if self.client_process.poll() is not None:
                        out, err = self.client_process.communicate()
                        console.print("[red]Client process terminated unexpectedly[/red]")
                        if out:
                            console.print(f"[yellow]Output: {out}[/yellow]")
                        if err:
                            console.print(f"[red]Error: {err}[/red]")
                        return
                    
                    if self._wait_for_port(self.client_port, timeout=60):
                        console.print(f"[green]Client started successfully on port {self.client_port}[/green]")
                    else:
                        console.print("[red]Failed to start client: Timeout waiting for port[/red]")
                        if self.client_process:
                            self.client_process.terminate()
                        return
            except subprocess.CalledProcessError as e:
                console.print(f"[red]Failed to install client dependencies: {str(e)}[/red]")
                return
            except Exception as e:
                console.print(f"[red]Failed to start client: {str(e)}[/red]")
                if self.client_process:
                    self.client_process.terminate()
                return

        if service == 'all':
            console.print("[green]All services are running![/green]")
            # Show the interactive menu after starting all services
            self.show_status()
            self.run()

    def stop(self, service: str = 'all') -> None:
        """Stop services based on selection."""
        def kill_process_on_port(port: int) -> None:
            for proc in psutil.process_iter(['pid', 'name', 'connections']):
                try:
                    for conn in proc.connections():
                        if conn.laddr.port == port:
                            os.kill(proc.pid, signal.SIGTERM)
                            break
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    pass

        if service in ['all', 'server']:
            kill_process_on_port(self.server_port)
            console.print("[green]Server stopped[/green]")

        if service in ['all', 'client']:
            kill_process_on_port(self.client_port)
            console.print("[green]Client stopped[/green]")

        if service in ['all', 'mongodb']:
            self.stop_mongodb()

        if service == 'all':
            console.print("[green]All services stopped[/green]")

    def restart(self, service: str = 'all') -> None:
        """Restart services based on selection."""
        console.print(f"[yellow]Restarting {service}...[/yellow]")
        self.stop(service)
        time.sleep(2)
        self.start(service)

    def status(self) -> None:
        """Check the status of all services."""
        table = Table(title="VIP Transaction Tracker Status")
        table.add_column("Service", style="cyan")
        table.add_column("Status", style="green")
        table.add_column("Port", style="yellow")
        table.add_column("Action", style="magenta")

        # Check MongoDB
        mongodb_status = "Running" if self.check_mongodb() else "Stopped"
        table.add_row(
            "MongoDB",
            mongodb_status,
            str(self.mongodb_port),
            "Press 1 to toggle"
        )

        # Check Server
        server_status = "Running" if self._is_port_in_use(self.server_port) else "Stopped"
        table.add_row(
            "Server",
            server_status,
            str(self.server_port),
            "Press 2 to toggle"
        )

        # Check Client
        client_status = "Running" if self._is_port_in_use(self.client_port) else "Stopped"
        table.add_row(
            "Client",
            client_status,
            str(self.client_port),
            "Press 3 to toggle"
        )

        console.print(table)

    def show_menu(self) -> None:
        """Display the main menu."""
        menu = Table(title="VIP Transaction Tracker Management", show_header=False, box=None)
        menu.add_row("[cyan]1.[/cyan] Toggle MongoDB")
        menu.add_row("[cyan]2.[/cyan] Toggle Server")
        menu.add_row("[cyan]3.[/cyan] Toggle Client")
        menu.add_row("[cyan]4.[/cyan] Start All Services")
        menu.add_row("[cyan]5.[/cyan] Stop All Services")
        menu.add_row("[cyan]6.[/cyan] Restart All Services")
        menu.add_row("[cyan]7.[/cyan] View Logs")
        menu.add_row("[cyan]8.[/cyan] Clear Screen")
        menu.add_row("[cyan]9.[/cyan] Open UI in Browser")
        menu.add_row("[cyan]q.[/cyan] Quit")
        
        console.print("\n")
        console.print(menu)
        console.print("\n")

    def view_logs(self) -> None:
        """View logs for selected service."""
        log_menu = Table(title="Select Service to View Logs", show_header=False, box=None)
        log_menu.add_row("[cyan]1.[/cyan] MongoDB Logs")
        log_menu.add_row("[cyan]2.[/cyan] Server Logs")
        log_menu.add_row("[cyan]3.[/cyan] Client Logs")
        log_menu.add_row("[cyan]b.[/cyan] Back to Main Menu")
        
        console.print("\n")
        console.print(log_menu)
        console.print("\n")
        
        choice = Prompt.ask("Select an option", choices=["1", "2", "3", "b"])
        
        if choice == "b":
            return
            
        log_files = {
            "2": os.path.join(self.server_dir, 'logs', 'server.log'),
            "3": os.path.join(self.client_dir, 'logs', 'client.log')
        }
        
        try:
            if choice == "1":
                os.system('brew services logs mongodb/brew/mongodb-community@7.0 | tail -n 50')
            else:
                log_file = log_files[choice]
                if not os.path.exists(log_file):
                    # Create empty log file if it doesn't exist
                    os.makedirs(os.path.dirname(log_file), exist_ok=True)
                    open(log_file, 'a').close()
                    console.print(f"[yellow]Log file is empty. Waiting for logs...[/yellow]")
                else:
                    os.system(f"tail -n 50 {log_file}")
            
            input("\nPress Enter to continue...")
        except Exception as e:
            console.print(f"[red]Error viewing logs: {str(e)}[/red]")
            time.sleep(2)

    def _update_vite_config(self) -> None:
        """Update Vite config with new port number."""
        vite_config = os.path.join(self.client_dir, 'vite.config.ts')
        if os.path.exists(vite_config):
            try:
                with open(vite_config, 'r') as f:
                    content = f.read()
                
                # Simple string replacement for port
                import re
                new_content = re.sub(r'port:\s*\d+', f'port: {self.client_port}', content)
                
                with open(vite_config, 'w') as f:
                    f.write(new_content)
                
                console.print(f"[green]Updated Vite config with new port: {self.client_port}[/green]")
            except Exception as e:
                console.print(f"[yellow]Warning: Failed to update Vite config: {str(e)}[/yellow]")

    def show_status(self) -> None:
        """Show current status of all services."""
        table = Table(title="VIP Transaction Tracker Status")
        table.add_column("Service")
        table.add_column("Status")
        table.add_column("Port")
        table.add_column("Action")

        services = [
            ("MongoDB", self.check_mongodb(), "27017", "Press 1 to toggle"),
            ("Server", bool(self.server_process), str(self.server_port), "Press 2 to toggle"),
            ("Client", bool(self.client_process), str(self.client_port), "Press 3 to toggle")
        ]

        for service, status, port, action in services:
            status_str = "[green]Running[/green]" if status else "[red]Stopped[/red]"
            table.add_row(service, status_str, port, action)

        console.print(table)

    def _open_browser(self) -> None:
        """Open the client UI in the default web browser."""
        client_port_info = self._is_port_in_use(self.client_port)
        if not client_port_info["in_use"]:
            console.print(f"[yellow]Client is not running. Cannot open UI.[/yellow]")
            if Confirm.ask("Do you want to start the client?"):
                self.start('client')
                time.sleep(2) # Give it a moment to start
                # Re-check after attempting start
                client_port_info = self._is_port_in_use(self.client_port)
                if not client_port_info["in_use"]:
                    console.print("[red]Failed to start client. Cannot open UI.[/red]")
                    return
            else:
                return

        url = f"http://localhost:{self.client_port}"
        try:
            console.print(f"[yellow]Opening {url} in your default browser...[/yellow]")
            webbrowser.open(url)
            console.print("[green]Browser opened.[/green]")
        except Exception as e:
            console.print(f"[red]Failed to open browser: {str(e)}[/red]")

    def run(self) -> None:
        """Run the interactive menu system."""
        while self.running:
            os.system('clear' if os.name == 'posix' else 'cls')
            self.status()
            self.show_menu()
            
            choice = Prompt.ask("Select an option", choices=["1", "2", "3", "4", "5", "6", "7", "8", "9", "q"])
            
            if choice == "q":
                if Confirm.ask("Do you want to stop all services before quitting?"):
                    self.stop()
                self.running = False
                continue
                
            actions = {
                "1": lambda: self.restart('mongodb') if self.check_mongodb() else self.start('mongodb'),
                "2": lambda: self.stop('server') if self._is_port_in_use(self.server_port) else self.start('server'),
                "3": lambda: self.stop('client') if self._is_port_in_use(self.client_port) else self.start('client'),
                "4": lambda: self.start('all'),
                "5": lambda: self.stop('all'),
                "6": lambda: self.restart('all'),
                "7": self.view_logs,
                "8": lambda: os.system('clear' if os.name == 'posix' else 'cls'),
                "9": self._open_browser
            }
            
            try:
                actions[choice]()
                if choice not in ["8", "9"]:  # Don't wait after clearing screen or opening browser
                    time.sleep(1)
            except Exception as e:
                console.print(f"[red]Error: {str(e)}[/red]")
                time.sleep(2)

if __name__ == "__main__":
    try:
        app = AppManager()
        if len(sys.argv) > 1:
            command = sys.argv[1]
            if command == "start":
                service = sys.argv[2] if len(sys.argv) > 2 else "all"
                app.start(service)
            elif command == "stop":
                service = sys.argv[2] if len(sys.argv) > 2 else "all"
                app.stop(service)
            elif command == "restart":
                service = sys.argv[2] if len(sys.argv) > 2 else "all"
                app.restart(service)
            elif command == "status":
                app.status()
            else:
                print(f"Unknown command: {command}")
                sys.exit(1)
        else:
            # Run the interactive menu by default
            app.run()
    except Exception as e:
        print(f"Error: (pid={os.getpid()})")
        print("An error occurred:")
        print(str(e))
        traceback.print_exc()
        sys.exit(1) 