const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const chalk = require('chalk');

const bashCompletionScript = `
_rax_completion() {
  local cur prev opts
  COMPREPLY=()
  cur="\${COMP_WORDS[COMP_CWORD]}"
  prev="\${COMP_WORDS[COMP_CWORD-1]}"
  
  # Main commands
  if [[ \${COMP_CWORD} == 1 ]]; then
    opts="create use mount unmount apply list server current help"
    COMPREPLY=( $(compgen -W "\${opts}" -- \${cur}) )
    return 0
  fi

  # Subcommands
  case "\${prev}" in
    server)
      opts="create list show edit delete"
      COMPREPLY=( $(compgen -W "\${opts}" -- \${cur}) )
      return 0
      ;;
    use|mount|unmount)
      # Complete with rack or server names
      if [[ \${prev} == "use" ]]; then
        # Complete with rack names
        local racks_dir="\${HOME}/.mcprax/racks"
        if [[ -d "\${racks_dir}" ]]; then
          local rack_files=$(ls "\${racks_dir}")
          local rack_names=""
          for file in \${rack_files}; do
            rack_names="\${rack_names} \${file%.json}"
          done
          COMPREPLY=( $(compgen -W "\${rack_names}" -- \${cur}) )
        fi
      else
        # Complete with server names
        local servers_dir="\${HOME}/.mcprax/servers"
        if [[ -d "\${servers_dir}" ]]; then
          local server_files=$(ls "\${servers_dir}")
          local server_names=""
          for file in \${server_files}; do
            server_names="\${server_names} \${file%.json}"
          done
          COMPREPLY=( $(compgen -W "\${server_names}" -- \${cur}) )
        fi
      fi
      return 0
      ;;
    *)
      ;;
  esac

  return 0
}

complete -F _rax_completion rax
`;

const zshCompletionScript = `
#compdef rax

_rax() {
  local -a commands
  local -a subcommands
  
  commands=(
    'create:Create a new, empty rack'
    'use:Activate a specific rack'
    'mount:Add server to the active rack'
    'unmount:Remove server from the active rack'
    'apply:Apply the active rack configuration to Claude Desktop'
    'list:List available racks'
    'server:Server management commands'
    'current:Show the currently active rack'
    'help:Display help information'
  )
  
  _arguments -C \\\\
    '(-h --help)'{-h,--help}'[Show help information]' \\\\
    '(-v --version)'{-v,--version}'[Show version information]' \\\\
    '1: :->command' \\\\
    '2: :->argument' \\\\
    '*: :->options'
  
  case $state in
    (command)
      _describe -t commands 'rax command' commands
      ;;
    (argument)
      case $words[2] in
        (server)
          subcommands=(
            'create:Create a new server configuration'
            'list:List available server configurations'
            'show:Show server configuration details'
            'edit:Edit server configuration'
            'delete:Delete server configuration'
          )
          _describe -t subcommands 'server subcommand' subcommands
          ;;
        (use)
          # Complete with rack names
          local rack_dir="\${HOME}/.mcprax/racks"
          if [[ -d "$rack_dir" ]]; then
            local -a rack_names
            rack_names=($(ls $rack_dir | sed 's/\\\\.json$//'))
            _describe -t rack_names 'rack name' rack_names
          fi
          ;;
        (mount|unmount)
          # Complete with server names
          local server_dir="\${HOME}/.mcprax/servers"
          if [[ -d "$server_dir" ]]; then
            local -a server_names
            server_names=($(ls $server_dir | sed 's/\\\\.json$//'))
            _describe -t server_names 'server name' server_names
          fi
          ;;
        (*)
          ;;
      esac
      ;;
    (*)
      ;;
  esac
}

_rax "$@"
`;

/**
 * Install shell completion scripts
 * @returns {boolean} true if successful, false otherwise
 */
function installCompletionScripts() {
  try {
    const userHome = os.homedir();
    
    // Create completion directories
    const bashCompletionDir = path.join(userHome, '.bash_completion.d');
    fs.ensureDirSync(bashCompletionDir);
    
    const zshCompletionDir = path.join(userHome, '.zsh', 'completion');
    fs.ensureDirSync(zshCompletionDir);
    
    // Write completion scripts
    fs.writeFileSync(path.join(bashCompletionDir, 'rax'), bashCompletionScript);
    fs.writeFileSync(path.join(zshCompletionDir, '_rax'), zshCompletionScript);
    
    console.log(chalk.green('✓ Installed shell completions for Bash and Zsh'));
    
    // Add source lines to shell config files if they don't exist
    const bashrcPath = path.join(userHome, '.bashrc');
    if (fs.existsSync(bashrcPath)) {
      let bashrcContent = fs.readFileSync(bashrcPath, 'utf8');
      const completionLine = 'for bcfile in ~/.bash_completion.d/* ; do . $bcfile; done';
      if (!bashrcContent.includes(completionLine)) {
        fs.appendFileSync(bashrcPath, `\n# mcprax command completion\n${completionLine}\n`);
        console.log(chalk.green('✓ Added Bash completion to .bashrc'));
      }
    }
    
    const zshrcPath = path.join(userHome, '.zshrc');
    if (fs.existsSync(zshrcPath)) {
      let zshrcContent = fs.readFileSync(zshrcPath, 'utf8');
      const completionLine = 'fpath=(~/.zsh/completion $fpath)';
      if (!zshrcContent.includes(completionLine)) {
        fs.appendFileSync(zshrcPath, `\n# mcprax command completion\n${completionLine}\nautoload -U compinit && compinit\n`);
        console.log(chalk.green('✓ Added Zsh completion to .zshrc'));
      }
    }
    
    return true;
  } catch (error) {
    console.error(chalk.red(`Error installing shell completions: ${error.message}`));
    return false;
  }
}

module.exports = {
  installCompletionScripts
};