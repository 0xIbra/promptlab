# Repo Prompter

## Overview
Repo Prompter is an Electron-based desktop application that allows users to select a folder and view its contents in a structured file tree. The application provides a user-friendly interface for managing files and directories, making it easier to navigate and select files.

## Features
- **Folder Selection**: Users can select a directory from their file system.
- **File Tree View**: Displays the contents of the selected folder in a hierarchical structure.
- **Instructions Panel**: A dedicated area for displaying instructions or notes related to the selected files.
- **Selected Files Display**: Shows a list of files that the user has selected from the file tree.

## Technologies Used
- **Electron**: For building cross-platform desktop applications with web technologies.
- **React**: For building the user interface.
- **Node.js**: For backend operations and file system interactions.

## File Structure
- `main.js`: The main process of the Electron application, responsible for creating the application window and handling file system operations.
- `index.html`: The HTML file that serves as the entry point for the application.
- `src/index.jsx`: The entry point for the React application, rendering the main `App` component.
- `src/App.jsx`: The main React component that manages the application state and renders the UI components.

## Getting Started
1. Clone the repository.
2. Install the dependencies using `npm install`.
3. Run the application using `npm start`.

## License
This project is licensed under the MIT License.

## Acknowledgments
- Thanks to the Electron and React communities for their contributions and support.

