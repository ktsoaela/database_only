# 🚀 GitHub Actions Workflows

This directory contains automated workflows for building, testing, and releasing DATABASE ONLY.

## 📋 **Available Workflows**

### **1. 🚀 Release Workflow** (`release.yml`)
**Triggers:** 
- Push tags (e.g., `v1.0.0`)
- Manual dispatch

**What it does:**
- Builds for all platforms (Windows, macOS, Linux)
- Creates GitHub releases automatically
- Uploads build artifacts to releases
- Generates professional release notes

**How to use:**
```bash
# Create and push a tag
git tag v1.0.0
git push origin v1.0.0
```

### **2. 🧪 Development Workflow** (`development.yml`)
**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`

**What it does:**
- Runs tests on every push
- Builds for all platforms
- Uploads build artifacts for testing
- Ensures code quality

### **3. 🎯 Manual Release Workflow** (`manual-release.yml`)
**Triggers:**
- Manual dispatch only

**What it does:**
- Allows manual release creation
- Choose specific platforms
- Custom version numbers
- Perfect for hotfixes or specific builds

## 🎮 **How to Use**

### **Automatic Releases (Recommended)**
1. **Make changes** to your code
2. **Commit and push** to main branch
3. **Create a tag** for the new version:
   ```bash
   git tag v1.1.0
   git push origin v1.1.0
   ```
4. **GitHub Actions automatically:**
   - Builds for all platforms
   - Creates a release
   - Uploads installers
   - Generates release notes

### **Manual Releases**
1. Go to **Actions** tab in your repository
2. Select **"Manual Release"** workflow
3. Click **"Run workflow"**
4. Fill in:
   - **Version**: e.g., `v1.0.1`
   - **Platform**: `all`, `windows`, `linux`, or `macos`
5. Click **"Run workflow"**

### **Development Testing**
- **Every push** automatically triggers tests
- **Build artifacts** are uploaded for testing
- **No manual intervention** required

## 🔧 **Configuration**

### **Build Targets**
- **Windows**: NSIS installer + portable exe
- **macOS**: DMG installer
- **Linux**: AppImage

### **Dependencies**
- **Node.js**: v18
- **Python**: 3.9
- **Electron**: Latest stable
- **Electron Builder**: Latest stable

### **Caching**
- **Electron binaries** are cached for faster builds
- **npm dependencies** are cached
- **Build artifacts** are preserved between runs

## 📱 **Output**

### **Release Assets**
- **Windows**: `DATABASE-ONLY-Setup.exe`, `DATABASE-ONLY.exe`
- **macOS**: `DATABASE-ONLY.dmg`
- **Linux**: `DATABASE-ONLY.AppImage`
- **All**: Source code zip

### **Release Notes**
- **Automatic generation** from workflow
- **Professional formatting** with emojis
- **Feature descriptions** and installation instructions
- **System requirements** and platform information

## 🚨 **Troubleshooting**

### **Common Issues**
1. **Build fails on Windows**
   - Check if native dependencies are compatible
   - Verify Node.js version compatibility

2. **macOS build fails**
   - Ensure code signing is properly configured
   - Check macOS version compatibility

3. **Linux build fails**
   - Verify AppImage dependencies
   - Check Linux distribution compatibility

### **Debug Mode**
Enable debug logging by setting:
```yaml
env:
  DEBUG: electron-builder
```

## 🔄 **Customization**

### **Adding New Platforms**
1. Add new OS to matrix strategy
2. Configure build targets in package.json
3. Update artifact upload paths

### **Modifying Build Process**
1. Edit workflow files in `.github/workflows/`
2. Update package.json build configuration
3. Test changes in development workflow

### **Release Notes**
1. Modify the `body` section in workflows
2. Add custom changelog generation
3. Include issue references and PR links

## 📚 **Resources**

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Electron Builder Documentation](https://www.electron.build/)
- [Workflow Syntax Reference](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)

---

**Built with ❤️ by Khotso Tsoaela**

*Automating the future of database management*
