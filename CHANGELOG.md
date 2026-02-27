# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-02-27

### Added
- **Core Diagnostic Engine**: Implemented the 6-phase structured conversation flow.
- **Modes**: Added support for C-side, B-side, and custom "Create Mode" diagnostic flows.
- **Chat Interface**: Developed a responsive chat area with typewriter effects and smooth animations.
- **Sidebar**: Implemented a collapsible sidebar with history management and new chat functionality.
- **Floating Stepper**: Added a visual progress tracker for the diagnostic phases.
- **Report Generation**: Enabled generating and downloading diagnostic reports in Markdown/PDF format.
- **Responsive Design**: Optimized layout for Desktop, Tablet, and Mobile devices.
- **Testing**: Added unit tests with Jest and React Testing Library.
- **Component Library**: Integrated Storybook for component development and documentation.

### Changed
- Refactored sidebar to use a fixed inner container for smoother transition animations.
- Updated chat area layout to center content with a maximum width of 1240px (content) and 960px (input).
- Removed avatar icons from system messages for a cleaner UI.
- Improved mobile experience with a drawer-style sidebar and overlay.

### Fixed
- Fixed sidebar transition artifacts where content would appear to move in the wrong direction during collapse/expand.
- Fixed layout issues on mobile devices where the input area would be obscured.

### Technical
- Initialized project with Vite + React + TypeScript.
- Configured Tailwind CSS for styling.
- Set up Framer Motion for animations.
- integrated Zustand for state management (if applicable, or Context API as per current implementation).
