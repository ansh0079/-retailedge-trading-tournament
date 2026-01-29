// Technical Analysis Integration
// Dynamically injects the technical analysis tab into the stock modal

(function () {
    console.log('🔄 Initializing Technical Analysis Integration...');

    // Configuration
    const SELECTORS = {
        modal: '.modal-content, [role="dialog"]', // Try to match the modal container
        tabContainer: '.flex.border-b.border-slate-700', // Typical tab container class
        tabButton: '.tab-btn, button.border-b-2', // Tab button classes
        contentContainer: '.p-6.space-y-6, .modal-body', // Content area
        stockSymbol: '.text-3xl.font-bold, h2' // Where the symbol might be
    };

    class TechnicalAnalysisIntegrator {
        constructor() {
            this.observer = null;
            this.currentSymbol = null;
            this.init();
        }

        init() {
            // Observe the body for modal opening
            this.observer = new MutationObserver(this.handleMutations.bind(this));
            this.observer.observe(document.body, { childList: true, subtree: true });
            console.log('👀 Watching for stock modal...');
        }

        handleMutations(mutations) {
            for (const mutation of mutations) {
                if (mutation.addedNodes.length > 0) {
                    // Check if a modal was added
                    const modal = document.querySelector(SELECTORS.modal);
                    if (modal && !modal.dataset.hasTechnicalAnalysis) {
                        this.injectTab(modal);
                    }
                }
            }
        }

        injectTab(modal) {
            console.log('🟢 Stock modal detected!');
            modal.dataset.hasTechnicalAnalysis = 'true';

            // Find the tab container
            const tabContainer = modal.querySelector(SELECTORS.tabContainer);
            if (!tabContainer) {
                console.warn('⚠️ Could not find tab container in modal');
                return;
            }

            // Detect current stock symbol
            this.detectSymbol(modal);

            // Create the new tab button
            const techTab = document.createElement('button');
            techTab.className = 'tab-btn px-4 py-2 text-sm font-medium text-slate-400 hover:text-cyan-400 border-b-2 border-transparent transition-colors';
            techTab.innerHTML = '📊 Technical Analysis';
            techTab.dataset.tab = 'technical';

            // Insert after the last tab
            tabContainer.appendChild(techTab);

            // Create the content container
            const contentContainer = modal.querySelector(SELECTORS.contentContainer) || modal;
            const techContent = document.createElement('div');
            techContent.id = 'technical-analysis-content';
            techContent.className = 'hidden mt-6 animate-fade-in';
            contentContainer.appendChild(techContent);

            // Add click handler
            techTab.addEventListener('click', () => {
                this.activateTab(modal, techTab, techContent);
            });

            // Also listen for other tab clicks to deactivate this one
            const otherTabs = tabContainer.querySelectorAll('button:not([data-tab="technical"])');
            otherTabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    this.deactivateTab(techTab, techContent);
                });
            });

            console.log('✅ Technical Analysis tab injected');
        }

        detectSymbol(modal) {
            // Try to find the symbol in the modal header
            const headerElement = modal.querySelector(SELECTORS.stockSymbol);
            if (headerElement) {
                // Extract symbol (e.g., "AAPL" from "AAPL - Apple Inc.")
                const text = headerElement.textContent.trim();
                const match = text.match(/^([A-Z]+)/);
                if (match) {
                    this.currentSymbol = match[1];
                    console.log(`📍 Detected symbol: ${this.currentSymbol}`);
                }
            }
        }

        activateTab(modal, tab, content) {
            // Deactivate other tabs
            const tabs = modal.querySelectorAll(SELECTORS.tabButton);
            tabs.forEach(t => {
                t.classList.remove('text-cyan-400', 'border-cyan-400');
                t.classList.add('text-slate-400', 'border-transparent');
            });

            // Activate this tab
            tab.classList.remove('text-slate-400', 'border-transparent');
            tab.classList.add('text-cyan-400', 'border-cyan-400');

            // Hide other content (basic way - specific to app structure)
            // We assume siblings of our content container are the other tab contents
            Array.from(content.parentNode.children).forEach(child => {
                if (child !== content && !child.classList.contains('flex')) { // Avoid hiding the header
                    child.style.display = 'none';
                }
            });

            // Show our content
            content.style.display = 'block';
            content.classList.remove('hidden');

            // Render analysis if we have a symbol
            if (this.currentSymbol && window.TechnicalAnalysisUI) {
                window.TechnicalAnalysisUI.renderAnalysis(this.currentSymbol, 'technical-analysis-content');
            } else {
                content.innerHTML = `
          <div class="text-center p-8 text-slate-400">
            <p>Could not detect stock symbol or UI engine not loaded.</p>
            <p class="text-xs mt-2">Symbol: ${this.currentSymbol || 'Unknown'}</p>
          </div>
        `;
            }
        }

        deactivateTab(tab, content) {
            tab.classList.remove('text-cyan-400', 'border-cyan-400');
            tab.classList.add('text-slate-400', 'border-transparent');
            content.classList.add('hidden');
            content.style.display = 'none';

            // Restore other content visibility (simple heuristic)
            if (content.parentNode) {
                Array.from(content.parentNode.children).forEach(child => {
                    if (child !== content && !child.classList.contains('flex') && child.tagName === 'DIV') {
                        child.style.display = ''; // Reset to default (block usually)
                    }
                });
            }
        }
    }

    // Start the integrator
    window.addEventListener('load', () => {
        window.TechnicalAnalysisIntegrator = new TechnicalAnalysisIntegrator();
    });

})();
