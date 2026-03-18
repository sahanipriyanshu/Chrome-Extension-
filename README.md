# LeetCode GitHub AI Sync

**LeetCode GitHub AI Sync** is a powerful Chrome extension designed to streamline your coding workflow. It automatically synchronizes your successful LeetCode submissions to a GitHub repository of your choice, ensuring your progress is always documented. Optionally, it can enhance your solutions using AI to provide cleaner code, detailed comments, and complexity analysis.

## 🚀 Features

- **Automatic Sync**: seamlessly pushes your accepted LeetCode solutions to GitHub.
- **AI Enhancement**: Uses Google's Gemini AI to refactor, comment, and analyze your code before syncing (optional).
- **Customizable**: Choose your target repository and branch.
- **Problem Metadata**: Automatically includes problem title, difficulty, and description in the synced files.
- **Dashboard**: Easy-to-use interface for configuration and status monitoring.

## 🛠️ Installation

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/sahanipriyanshu/Chrome-Extension-.git
    ```
2.  **Load the Extension in Chrome**:
    - Open Chrome and navigate to `chrome://extensions/`.
    - Enable **Developer mode** in the top right corner.
    - Click **Load unpacked** and select the `leetcode-github-ai-extension` folder.

## ⚙️ Configuration

1.  Click the extension icon in your browser to open the dashboard.
2.  **GitHub Token**: Generate a Personal Access Token (PAT) with `repo` permissions and enter it in the dashboard.
3.  **Repository Name**: Enter the full name of your target repository (e.g., `username/leetcode-solutions`).
4.  **AI Integration (Optional)**: Provide a Google AI (Gemini) API key to enable code enhancement features.

## 📖 Usage

Once configured, the extension works automatically in the background. Every time you submit a solution on LeetCode and it passes, the extension will:
1.  Extract the code and problem details.
2.  (Optional) Send the code to Gemini AI for enhancement.
3.  Push the final result to your specified GitHub repository.

## 💻 Technologies Used

- **JavaScript**: Core logic for the extension.
- **Chrome Extension API**: Background scripts, content scripts, and storage.
- **GitHub API**: For repository interaction and code syncing.
- **Google Gemini AI API**: For intelligent code enhancement.
- **HTML/CSS**: Sleek and intuitive dashboard interface.

---

*Happy Coding!*
