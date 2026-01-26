# Streamlit entry point for the Intelligent Agent Platform
# Integrates the Ultimate Trading Intelligence Platform UI

import sys
import os

# Ensure the parent directory is in sys.path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from integrated_trading_platform import main

if __name__ == "__main__":
    main()
