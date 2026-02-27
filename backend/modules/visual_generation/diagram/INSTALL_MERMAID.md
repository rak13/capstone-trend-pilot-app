# Mermaid CLI Installation Instructions

To enable diagram rendering, install Mermaid CLI globally using npm:

```
npm install -g @mermaid-js/mermaid-cli
```

This is required for the diagram rendering script to work. Ensure Node.js and npm are installed on your system.

For Docker packaging, add this line to your Dockerfile:

```
RUN npm install -g @mermaid-js/mermaid-cli
```
