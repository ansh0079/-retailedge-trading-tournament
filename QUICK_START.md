# 🚀 Quick Start - API Keys Setup

## ✅ API Keys Are Set!

Your API keys have been configured for the current PowerShell session:

- ✅ **ANTHROPIC_API_KEY** (Team 1 - Claude)
- ✅ **DEEPSEEK_API_KEY** (Team 2 - DeepSeek)  
- ✅ **GOOGLE_API_KEY** (Team 4 - Gemini)
- ⚠️ **OPENAI_API_KEY** (Team 3 - GPT-4o) - Not set

## ⚠️ Important Note

You have a **KIMI API key**, but the tournament script expects **OPENAI_API_KEY** for Team 3. 

**Options:**
1. **Run with Teams 1, 2, and 4 only** (skip Team 3):
   ```powershell
   python deepseek_python_20260119_ac400a.py --teams "1,2,4"
   ```

2. **Get an OpenAI API key** from https://platform.openai.com/api-keys

3. **Modify the script** to use KIMI instead of OpenAI (requires code changes)

## 🎮 Ready to Run!

Now you can start the tournament:

```powershell
# Quick 1-day test
python deepseek_python_20260119_ac400a.py --days 1 --teams "1,2,4"

# Full 90-day tournament (with available teams)
python deepseek_python_20260119_ac400a.py --teams "1,2,4"
```

## 📝 Making Keys Permanent

The keys are currently set for **this PowerShell session only**. 

To make them permanent:

1. **Option 1: Run the permanent setup script** (as Administrator):
   ```powershell
   .\set-api-keys-permanent.ps1
   ```

2. **Option 2: Set manually via Windows Settings**:
   - Press `Win + X` → System → Advanced system settings
   - Environment Variables → New
   - Add each key as a User variable

3. **Option 3: Set in each new PowerShell session**:
   ```powershell
   .\set-api-keys.ps1
   ```

## 🔍 Verify Keys Are Set

```powershell
echo $env:ANTHROPIC_API_KEY
echo $env:DEEPSEEK_API_KEY
echo $env:GOOGLE_API_KEY
```

If you see the keys, you're ready to go! 🎉
