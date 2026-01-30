// Technical Analysis Integration (Robust Version)
// Dynamically injects the technical analysis tab into the stock modal

(function () {
    console.log('🔄 Initializing Robust Technical Analysis Integration...');

    const DEBUG = true;
    function log(...args) {
        if (DEBUG) console.log('🛠️ [TA-Integrator]:', ...args);
    }

    // Configuration - Multiple strategies to find elements
    const STRATEGIES = {
        modal: [
            '.modal-content',
            '[role="dialog"]',
            '.fixed.inset-0.z-50.flex.items-center.justify-center', // Common tailwind modal overlay
            '.glass-card.w-full.max-w-4xl' // Likely modal container class
        ],
        tabContainer: [
            '.flex.border-b.border-slate-700',
            '.flex.space-x-4.border-b',
            (el) => Array.from(el.querySelectorAll('div')).find(d => d.textContent.includes('Overview') && d.textContent.includes('Financials'))
        ],
        stockSymbol: [
            '.text-3xl.font-bold',
            'h2.text-2xl',
            (el) => {
                // Find any element that looks like a stock symbol (uppercase, 1-5 chars)
                const candidates = Array.from(el.querySelectorAll('h1, h2, h3, div'));
                return candidates.find(c => /^[A-Z]{1,5}$/.test(c.innerText.trim()));
            }
        ]
    };

    class TechnicalAnalysisIntegrator {
        constructor() {
            this.observer = null;
            this.currentSymbol = null;
            this.injectedModal = null;
            this.init();
            this.createDebugControl();
        }

        createDebugControl() {
            // Small button in bottom left to force check
            const btn = document.createElement('button');
            btn.innerText = '🛠️ Fix Tabs';
            btn.style.position = 'fixed';
            btn.style.bottom = '10px';
            btn.style.left = '10px';
            btn.style.zIndex = '9999';
            btn.style.background = '#0ea5e9'; // Cyan-500
            btn.style.color = 'white';
            btn.style.padding = '5px 10px';
            btn.style.borderRadius = '5px';
            btn.style.fontSize = '12px';
            btn.style.opacity = '0.5';
            btn.onmouseover = () => btn.style.opacity = '1';
            btn.onmouseout = () => btn.style.opacity = '0.5';

            btn.onclick = () => {
                log('Manual trigger initiated');
                this.scanForModal();
            };

            document.body.appendChild(btn);
        }

        init() {
            // Observe the body for ANY changes
            this.observer = new MutationObserver((mutations) => {
                // Debounce slightly to avoid thrashing
                if (this.mutationTimeout) clearTimeout(this.mutationTimeout);
                this.mutationTimeout = setTimeout(() => {
                    this.scanForModal();
                }, 100);
            });

            this.observer.observe(document.body, {
                childList: true,
                subtree: true
            });

            log('Observer started');

            // Also check periodically just in case
            setInterval(() => this.scanForModal(), 2000);
        }

        scanForModal() {
            // Try to find the modal using multiple selectors
            let modal = null;

            // Strategy 1: Look for standard modal classes
            for (const selector of STRATEGIES.modal) {
                const el = document.querySelector(selector);
                if (el) {
                    modal = el;
                    break;
                }
            }

            // Strategy 2: Look for text unique to the modal
            if (!modal) {
                const allDivs = document.querySelectorAll('div');
                for (const div of allDivs) {
                    if (div.innerText.includes('Overview') && div.innerText.includes('Financials') && div.innerText.includes('News')) {
                        // This is likely the modal or the tab container's parent
                        modal = div.closest('.glass-card') || div.closest('[role="dialog"]') || div.closest('.fixed');
                        if (modal) break;
                    }
                }
            }

            if (modal && modal !== this.injectedModal) {
                if (!modal.dataset.hasTechnicalAnalysis) {
                    this.injectTab(modal);
                }
            }
        }

        injectTab(modal) {
            log('🟢 Potential modal found!', modal);

            // Find tab container
            let tabContainer = null;
            const candidates = modal.querySelectorAll('div');

            // Look for the container that holds the existing tabs
            for (const div of candidates) {
                const text = div.innerText;
                if (text.includes('Overview') && text.includes('Fundamentals')) {
                    tabContainer = div;
                    // It might be the specific flex container
                    if (div.children.length > 0 && div.children[0].tagName === 'BUTTON') {
                        // Perfect
                    } else {
                        // Maybe it's a child
                        const buttonContainer = Array.from(div.querySelectorAll('div')).find(d => d.querySelector('button'));
                        if (buttonContainer) tabContainer = buttonContainer;
                    }
                    break;
                }
            }

            if (!tabContainer) {
                // Fallback: look for a flex border-b div
                tabContainer = modal.querySelector('.flex.border-b');
            }

            if (!tabContainer) {
                log('⚠️ Could not find tab container. Aborting injection.');
                return;
            }

            log('Found tab container:', tabContainer);
            modal.dataset.hasTechnicalAnalysis = 'true';
            this.injectedModal = modal;

            // Detect Symbol
            this.detectSymbol(modal);

            // Create Tab Button
            const techTab = document.createElement('button');
            // Copy classes from sibling for consistency
            const sibling = tabContainer.querySelector('button');
            if (sibling) {
                techTab.className = sibling.className;
                techTab.classList.remove('text-cyan-400', 'border-cyan-400', 'text-slate-400', 'border-transparent'); // Reset specific state
                techTab.classList.add('text-slate-400', 'border-transparent'); // Default inactive state
            } else {
                techTab.className = 'px-4 py-2 text-sm font-medium text-slate-400 hover:text-cyan-400 border-b-2 border-transparent transition-colors';
            }

            techTab.innerHTML = '📊 Technical Analysis';
            techTab.dataset.tab = 'technical';

            // Insert Logic
            tabContainer.appendChild(techTab);

            // Create Content Container
            // Usually the content is a sibling of the tab container or in a parent wrapper
            let contentParent = tabContainer.parentElement;

            const techContent = document.createElement('div');
            techContent.id = 'technical-analysis-content';
            techContent.className = 'hidden mt-6 animate-fade-in p-1'; // Added p-1 to ensure visibility
            techContent.style.minHeight = '300px'; // Ensure it takes space

            contentParent.appendChild(techContent);

            // Event Listeners
            techTab.onclick = () => {
                this.activateTab(modal, tabContainer, techTab, techContent);
            };

            // Hook into other tabs to deactivate ours
            const otherTabs = tabContainer.querySelectorAll('button:not([data-tab="technical"])');
            otherTabs.forEach(t => {
                t.addEventListener('click', () => {
                    this.deactivateTab(techTab, techContent);
                });
            });

            log('✅ Tab injection complete');
        }

        detectSymbol(modal) {
            // Strategy: Look for the largest text, or text matching symbol pattern
            const headers = Array.from(modal.querySelectorAll('h1, h2, h3, .text-3xl, .text-2xl'));
            for (const h of headers) {
                const text = h.innerText.trim();
                // Look for symbol at start (e.g., "AAPL - Apple Inc")
                const match = text.match(/^([A-Z]{1,5})\s/);
                if (match) {
                    this.currentSymbol = match[1];
                    log('📍 Detected symbol:', this.currentSymbol);
                    return;
                }
                // Or just absolute symbol
                if (/^[A-Z]{1,5}$/.test(text)) {
                    this.currentSymbol = text;
                    log('📍 Detected symbol:', this.currentSymbol);
                    return;
                }
            }

            // Fallback: Check if there's a global current stock variable (often used in simple apps)
            if (window.currentStockSymbol) {
                this.currentSymbol = window.currentStockSymbol;
                return;
            }
        }

        activateTab(modal, container, tab, content) {
            log('Activating Technical Analysis tab...');

            // Deactivate visual state of other tabs
            const tabs = container.querySelectorAll('button');
            tabs.forEach(t => {
                // Heuristic: remove active classes, add inactive classes
                t.classList.remove('text-cyan-400', 'border-cyan-400', 'border-b-2');
                t.classList.add('text-slate-400', 'border-transparent');
                // If the app uses different active classes, we might need to be smarter, 
                // but typically removing the "active" color and adding "inactive" color works.

                // Re-add border-b-2 if it was stripped and is needed for layout
                if (t.className.includes('border-b-2')) {
                    // It's fine
                } else {
                    t.classList.add('border-b-2');
                }
            });

            // Activate our tab
            tab.classList.remove('text-slate-400', 'border-transparent');
            tab.classList.add('text-cyan-400', 'border-cyan-400');

            // Hide all other content containers
            // We assume the content containers are siblings of our content div
            // OR they are children of the parent that are NOT the tab container and NOT our content
            const parent = content.parentElement;
            const children = Array.from(parent.children);

            children.forEach(child => {
                if (child === content) return; // Don't hide self
                if (child === container) return; // Don't hide tabs
                if (child.contains(container)) return; // Don't hide wrapper of tabs
                if (child.tagName === 'H2' || child.querySelector('h2')) return; // Header

                // Hide it
                child.style.display = 'none';
                child.classList.add('hidden');
            });

            // Show our content
            content.style.display = 'block';
            content.classList.remove('hidden');

            // Update Symbol just in case it changed
            this.detectSymbol(modal);

            if (this.currentSymbol && window.TechnicalAnalysisUI) {
                window.TechnicalAnalysisUI.renderAnalysis(this.currentSymbol, 'technical-analysis-content');
            } else {
                content.innerHTML = `<div class='p-8 text-center text-red-400'>Error: Symbol not found (${this.currentSymbol}) or UI engine missing.</div>`;
            }
        }

        deactivateTab(tab, content) {
            tab.classList.remove('text-cyan-400', 'border-cyan-400');
            tab.classList.add('text-slate-400', 'border-transparent');

            content.style.display = 'none';
            content.classList.add('hidden');

            // We don't need to explicitly show the others, the app's own logic will likely do that 
            // when the user clicks the other tabs. We just need to get out of the way.
            // BUT, if the app doesn't use style.display, we might need to revert our hiding.
            const parent = content.parentElement;
            Array.from(parent.children).forEach(child => {
                if (child.style.display === 'none' && child !== content) {
                    child.style.display = ''; // Revert to stylesheet default
                    child.classList.remove('hidden');
                }
            });
        }
    }

    // Start
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => new TechnicalAnalysisIntegrator());
    } else {
        new TechnicalAnalysisIntegrator();
    }

})();
