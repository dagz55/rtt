#!/usr/bin/env python3
import json
import os
import platform
import shutil
import subprocess
import sys
import time
from pathlib import Path
from typing import Optional, Tuple


class SetupError(Exception):
    """Custom exception for setup errors"""
    pass

class ProjectSetup:
    def __init__(self):
        self.root_dir = Path(__file__).parent.absolute()
        self.server_dir = self.root_dir / 'server'
        self.client_dir = self.root_dir / 'client'
        self.env_file = self.server_dir / '.env'
        self.env_example_file = self.server_dir / '.env.example'
        self.node_version_required = '18.0.0'
        self.mongodb_version_required = '5.0.0'

    def print_step(self, message: str) -> None:
        """Print a formatted step message"""
        print(f"\n{'='*80}\n{message}\n{'='*80}")

    def show_menu(self) -> str:
        """Display the setup menu and return the user's choice"""
        self.print_step("VIP Transaction Tracker Setup Menu")
        print("\nAvailable options:")
        print("1. Check system requirements")
        print("2. Setup environment files")
        print("3. Install dependencies")
        print("4. Start MongoDB")
        print("5. Start development servers")
        print("6. Run complete setup (all steps)")
        print("0. Exit")
        
        while True:
            try:
                choice = input("\nEnter your choice (0-6): ").strip()
                if choice in ['0', '1', '2', '3', '4', '5', '6']:
                    return choice
                print("Invalid choice. Please enter a number between 0 and 6.")
            except KeyboardInterrupt:
                print("\nExiting...")
                sys.exit(0)

    def check_system_requirements(self) -> None:
        """Check if system meets the minimum requirements"""
        self.print_step("Checking system requirements...")
        
        try:
            # Check Node.js version
            node_version = subprocess.check_output(['node', '--version']).decode().strip().lstrip('v')
            if not self._version_satisfies(node_version, self.node_version_required):
                raise SetupError(f"Node.js version {self.node_version_required} or higher is required")
            print("✓ Node.js version check passed")
        except FileNotFoundError:
            raise SetupError("Node.js is not installed. Please install Node.js first")

        # Check npm installation
        try:
            subprocess.check_output(['npm', '--version'])
            print("✓ npm is installed")
        except FileNotFoundError:
            raise SetupError("npm is not installed. Please install npm first")

        # Check MongoDB installation (if not using Docker)
        try:
            mongo_version = subprocess.check_output(['mongod', '--version']).decode()
            version = mongo_version.split('\n')[0].split('v')[-1]
            if not self._version_satisfies(version, self.mongodb_version_required):
                print("⚠ Warning: MongoDB version might be lower than recommended")
            print("✓ MongoDB is installed")
        except FileNotFoundError:
            print("ℹ MongoDB not found locally - will use Docker if available")

        input("\nPress Enter to continue...")

    def _version_satisfies(self, current: str, required: str) -> bool:
        """Compare version strings"""
        current_parts = [int(x) for x in current.split('.')]
        required_parts = [int(x) for x in required.split('.')]
        return current_parts >= required_parts

    def setup_environment(self) -> None:
        """Set up environment files"""
        self.print_step("Setting up environment files...")
        
        if not self.env_example_file.exists():
            raise SetupError(".env.example file not found in server directory")

        if not self.env_file.exists():
            shutil.copy(self.env_example_file, self.env_file)
            print("✓ Created .env file from template")
        else:
            print("ℹ .env file already exists")

        input("\nPress Enter to continue...")

    def install_dependencies(self) -> None:
        """Install project dependencies"""
        self.print_step("Installing dependencies...")

        try:
            # Install server dependencies
            os.chdir(self.server_dir)
            self._run_command(['npm', 'install'], "server dependencies")

            # Install client dependencies
            os.chdir(self.client_dir)
            self._run_command(['npm', 'install'], "client dependencies")

            # Return to root directory
            os.chdir(self.root_dir)
            
            print("✓ All dependencies installed successfully")
        except Exception as e:
            raise SetupError(f"Failed to install dependencies: {e}")

        input("\nPress Enter to continue...")

    def _run_command(self, command: list, description: str) -> None:
        """Run a command with error handling"""
        try:
            subprocess.run(command, check=True)
            print(f"✓ Installed {description}")
        except subprocess.CalledProcessError as e:
            raise SetupError(f"Failed to install {description}: {e}")

    def start_mongodb(self) -> None:
        """Start MongoDB using Docker"""
        self.print_step("Starting MongoDB...")
        
        try:
            # Check if Docker is installed
            subprocess.check_output(['docker', '--version'])
            
            # Check if MongoDB container is running
            containers = subprocess.check_output(['docker', 'ps']).decode()
            if 'vip_transaction_mongodb' not in containers:
                print("Starting MongoDB container...")
                subprocess.run(['docker-compose', 'up', '-d', 'mongodb'], check=True)
                time.sleep(5)  # Wait for MongoDB to start
                print("✓ MongoDB container started")
            else:
                print("ℹ MongoDB container is already running")
        except FileNotFoundError:
            print("⚠ Docker not found. Please start MongoDB manually")
        except subprocess.CalledProcessError as e:
            raise SetupError(f"Failed to start MongoDB container: {e}")

        input("\nPress Enter to continue...")

    def start_development_servers(self) -> None:
        """Start development servers"""
        self.print_step("Starting development servers...")
        
        try:
            # Start backend server
            os.chdir(self.server_dir)
            server_process = subprocess.Popen(['npm', 'run', 'dev'])
            print("✓ Started backend server")

            # Start frontend server
            os.chdir(self.client_dir)
            client_process = subprocess.Popen(['npm', 'run', 'dev'])
            print("✓ Started frontend server")

            print("\nDevelopment servers are running!")
            print("Backend: http://localhost:5000")
            print("Frontend: http://localhost:5173")
            print("\nPress Ctrl+C to stop the servers...")

            # Wait for keyboard interrupt
            server_process.wait()
            client_process.wait()
        except KeyboardInterrupt:
            print("\nStopping servers...")
            server_process.terminate()
            client_process.terminate()
        except Exception as e:
            raise SetupError(f"Failed to start development servers: {e}")

    def run_all(self) -> None:
        """Run all setup steps in sequence"""
        try:
            self.check_system_requirements()
            self.setup_environment()
            self.install_dependencies()
            self.start_mongodb()
            self.start_development_servers()
        except SetupError as e:
            print(f"\n❌ Error: {e}")
            sys.exit(1)
        except KeyboardInterrupt:
            print("\n\nSetup interrupted by user")
            sys.exit(1)

    def run(self) -> None:
        """Run the setup process with menu"""
        while True:
            try:
                choice = self.show_menu()
                
                if choice == '0':
                    print("\nExiting setup. Goodbye!")
                    sys.exit(0)
                elif choice == '1':
                    self.check_system_requirements()
                elif choice == '2':
                    self.setup_environment()
                elif choice == '3':
                    self.install_dependencies()
                elif choice == '4':
                    self.start_mongodb()
                elif choice == '5':
                    self.start_development_servers()
                elif choice == '6':
                    self.run_all()
                    break  # Exit after complete setup
                
            except SetupError as e:
                print(f"\n❌ Error: {e}")
                input("\nPress Enter to return to menu...")
            except KeyboardInterrupt:
                print("\n\nSetup interrupted by user")
                sys.exit(1)

if __name__ == "__main__":
    setup = ProjectSetup()
    setup.run() 