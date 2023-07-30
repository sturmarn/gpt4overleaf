# AI-Powered Overleaf
This project adds the power of large-language models (LLMs) to Overleaf through a Chrome extension. 
It is a work in progress.

The plugin has been forked from [GPT4Overleaf](https://github.com/e3ntity/gpt4overleaf).

## Configuration
The plugin can be configured by clicking the plugin button in the Chrome toolbar. It requires inserting an API key from [OpenAI](https://platform.openai.com/account/api-keys). You also need to choose which tools you wish to enable.

## Usage
These are the tools that are currently available:

### Auto-complete
Select a text and press `Alt+c` to trigger the auto-complete tool.

### Improve
Select a text and press `Alt+i` to trigger the improvement tool. The original text will be commented out and the improved text will be inserted below it.

### Ask
Select a text and press `Alt+a` to trigger the ask tool. The original text will be deleted and the answer will be inserted in its place. 

For example: "Create a table 4x3 that the first row is bold face" will be replaced with, e.g.,:
```latex
\begin{tabular}{|c|c|c|}
\hline
\textbf{Column 1} & \textbf{Column 2} & \textbf{Column 3}\\
\hline
Entry 1 & Entry 2 & Entry 3\\
\hline
Entry 4 & Entry 5 & Entry 6\\
\hline
Entry 7 & Entry 8 & Entry 9\\
\hline
\end{tabular}
```

You can then, e.g.:
1. Write before the table: Place the following tabular inside a table environment, center it, and give the following title: "The comparison of the three approaches"
2. Select the sentence and the table
3. Press `Alt+a` to trigger the ask tool. 

The result will be:
```latex
\begin{table}[h]
\centering
\caption{The comparison of the three approaches}
\begin{tabular}{|c|c|c|}
\hline
\textbf{Column 1} & \textbf{Column 2} & \textbf{Column 3}\\
\hline
Entry 1 & Entry 2 & Entry 3\\
\hline
Entry 4 & Entry 5 & Entry 6\\
\hline
Entry 7 & Entry 8 & Entry 9\\
\hline
\end{tabular}
\end{table}
```

## Issues
If you encounter any issues, please open an issue in the project's repository.