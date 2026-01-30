// Technical Analysis UI Component
// Displays professional technical analysis reports with beautiful formatting

class TechnicalAnalysisUI {
    constructor() {
        this.engine = window.TechnicalAnalysisEngine;
        this.currentAnalysis = null;
    }

    // ═══════════════════════════════════════════════════════════════
    // MAIN RENDER FUNCTION
    // ═══════════════════════════════════════════════════════════════

    async renderAnalysis(symbol, containerId = 'technical-analysis-container', timeframe = '1D') {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container ${containerId} not found`);
            return;
        }

        // Show loading state
        container.innerHTML = this.renderLoadingState();

        try {
            // Generate analysis
            const analysis = await this.engine.generateFullAnalysis(symbol, timeframe);

            if (!analysis) {
                container.innerHTML = this.renderErrorState(symbol);
                return;
            }

            this.currentAnalysis = analysis;
            this.currentSymbol = symbol;

            // Render full analysis
            container.innerHTML = this.renderFullAnalysis(analysis);

            // Attach event listeners for timeframe selector
            this.attachTimeframeListeners(container, symbol, containerId);

            console.log('✅ Technical analysis rendered for', symbol);

        } catch (error) {
            console.error('Error rendering technical analysis:', error);
            container.innerHTML = this.renderErrorState(symbol, error.message);
        }
    }

    attachTimeframeListeners(container, symbol, containerId) {
        const timeframeButtons = container.querySelectorAll('[data-timeframe]');
        timeframeButtons.forEach(button => {
            button.addEventListener('click', async (e) => {
                const timeframe = e.target.dataset.timeframe;
                await this.renderAnalysis(symbol, containerId, timeframe);
            });
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // LOADING & ERROR STATES
    // ═══════════════════════════════════════════════════════════════

    renderLoadingState() {
        return `
      <div class="flex items-center justify-center py-12">
        <div class="text-center">
          <div class="animate-spin text-4xl mb-4">📊</div>
          <p class="text-slate-400">Generating technical analysis...</p>
          <p class="text-xs text-slate-500 mt-2">Calculating indicators, levels, and scenarios</p>
        </div>
      </div>
    `;
    }

    renderErrorState(symbol, message = 'Unable to generate analysis') {
        return `
      <div class="glass-card p-6 text-center">
        <div class="text-4xl mb-3">⚠️</div>
        <h3 class="text-lg font-semibold text-slate-300 mb-2">Analysis Unavailable</h3>
        <p class="text-sm text-slate-400">${message}</p>
        <p class="text-xs text-slate-500 mt-2">Symbol: ${symbol}</p>
      </div>
    `;
    }

    // ═══════════════════════════════════════════════════════════════
    // FULL ANALYSIS RENDER
    // ═══════════════════════════════════════════════════════════════

    renderFullAnalysis(analysis) {
        return `
      <div class="technical-analysis-report space-y-6">
        <!-- Header -->
        ${this.renderHeader(analysis)}
        
        <!-- Summary -->
        ${this.renderSummary(analysis)}
        
        <!-- Bulls vs. Bears -->
        ${this.renderBullsVsBears(analysis)}
        
        <!-- Bearish/Bullish Control -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${this.renderBearishControl(analysis)}
          ${this.renderBullishControl(analysis)}
        </div>
        
        <!-- Scenario Playbook -->
        ${this.renderScenarioPlaybook(analysis)}
        
        <!-- Educational Deep Dive -->
        ${this.renderEducationalContent(analysis)}
        
        <!-- The Big Picture -->
        ${this.renderBigPicture(analysis)}
        
        <!-- Support/Resistance Zones -->
        ${this.renderSupportResistanceZones(analysis)}
        
        <!-- Multi-Timeframe Prompt -->
        ${this.renderMultiTimeframePrompt(analysis)}
      </div>
    `;
    }

    // ═══════════════════════════════════════════════════════════════
    // INDIVIDUAL SECTIONS
    // ═══════════════════════════════════════════════════════════════

    renderHeader(analysis) {
        return `
      <div class="glass-card p-6 border-l-4 border-cyan-500">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-2xl font-bold text-white mb-1">
              📊 ${analysis.symbol} Technical Analysis
            </h2>
            <p class="text-sm text-slate-400">${analysis.timeframe} Chart • ${new Date(analysis.timestamp).toLocaleString()}</p>
          </div>
          <div class="text-right">
            <div class="text-3xl font-bold text-cyan-400">
              $${analysis.levels.current.toFixed(2)}
            </div>
            <div class="text-xs text-slate-400 mt-1">Current Price</div>
          </div>
        </div>
        
        <!-- Timeframe Selector -->
        <div class="flex items-center gap-2 pt-4 border-t border-slate-700">
          <span class="text-sm text-slate-400 mr-2">Timeframe:</span>
          ${['1H', '4H', '1D', '1W'].map(tf => `
            <button 
              data-timeframe="${tf}"
              class="px-3 py-1 rounded text-sm font-medium transition-all ${
                analysis.timeframe === tf 
                  ? 'bg-cyan-500 text-white' 
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }"
            >
              ${tf}
            </button>
          `).join('')}
        </div>
        
        <!-- Pattern Detection -->
        ${analysis.patterns?.hasPattern ? `
          <div class="mt-4 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
            <div class="flex items-center gap-2">
              <span class="text-lg">🔍</span>
              <div>
                <span class="font-semibold text-purple-400">Pattern Detected:</span>
                <span class="text-slate-300 ml-2">${analysis.patterns.latest}</span>
                ${analysis.patterns.all.length > 0 ? `
                  <span class="ml-2 px-2 py-0.5 rounded text-xs ${
                    analysis.patterns.all[0].type === 'bullish' ? 'bg-green-500/20 text-green-400' :
                    analysis.patterns.all[0].type === 'bearish' ? 'bg-red-500/20 text-red-400' :
                    'bg-yellow-500/20 text-yellow-400'
                  }">
                    ${analysis.patterns.all[0].type} • ${analysis.patterns.all[0].strength}
                  </span>
                ` : ''}
              </div>
            </div>
          </div>
        ` : ''}
      </div>
    `;
    }

    renderSummary(analysis) {
        return `
      <div class="glass-card p-6">
        <h3 class="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <span>📝</span> Summary
        </h3>
        <p class="text-slate-300 leading-relaxed">
          ${analysis.summary}
        </p>
      </div>
    `;
    }

    renderBullsVsBears(analysis) {
        const { bullsVsBears } = analysis;

        return `
      <div class="glass-card p-6">
        <h3 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span>🐂</span> ${bullsVsBears.title}
        </h3>
        
        <div class="space-y-4">
          <p class="text-sm font-semibold text-cyan-400 mb-3">Key battleground:</p>
          
          ${bullsVsBears.keyBattleground.map(item => `
            <div class="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <div class="flex items-start gap-3">
                <div class="text-2xl">📍</div>
                <div class="flex-1">
                  <div class="font-semibold text-white mb-1">${item.level}</div>
                  <p class="text-sm text-slate-400">${item.significance}</p>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    }

    renderBearishControl(analysis) {
        const { bearishControl } = analysis;

        return `
      <div class="glass-card p-5 border-l-4 border-red-500">
        <h4 class="text-base font-semibold text-white mb-3 flex items-center gap-2">
          <span>🔴</span> ${bearishControl.title}
        </h4>
        
        <ul class="space-y-3">
          ${bearishControl.items.map(item => `
            <li class="text-sm">
              <div class="font-medium text-red-400 mb-1">• ${item.factor}</div>
              <p class="text-slate-400 text-xs pl-4">${item.detail}</p>
            </li>
          `).join('')}
        </ul>
      </div>
    `;
    }

    renderBullishControl(analysis) {
        const { bullishControl } = analysis;

        return `
      <div class="glass-card p-5 border-l-4 border-green-500">
        <h4 class="text-base font-semibold text-white mb-3 flex items-center gap-2">
          <span>🟢</span> ${bullishControl.title}
        </h4>
        
        <ul class="space-y-3">
          ${bullishControl.items.map(item => `
            <li class="text-sm">
              <div class="font-medium text-green-400 mb-1">• ${item.factor}</div>
              <p class="text-slate-400 text-xs pl-4">${item.detail}</p>
            </li>
          `).join('')}
        </ul>
      </div>
    `;
    }

    renderScenarioPlaybook(analysis) {
        const { scenarios } = analysis;

        return `
      <div class="glass-card p-6">
        <h3 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span>🎯</span> Scenario Playbook: How the Next Move Unfolds
        </h3>
        
        <!-- Scenarios Table -->
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-slate-700">
                <th class="text-left py-3 px-4 text-slate-400 font-semibold">Direction</th>
                <th class="text-left py-3 px-4 text-slate-400 font-semibold">Entry (Trigger)</th>
                <th class="text-left py-3 px-4 text-slate-400 font-semibold">Stop</th>
                <th class="text-left py-3 px-4 text-slate-400 font-semibold">Target 1 / R:R</th>
                <th class="text-left py-3 px-4 text-slate-400 font-semibold">Target 2 / R:R</th>
                <th class="text-left py-3 px-4 text-slate-400 font-semibold">Confidence</th>
                <th class="text-left py-3 px-4 text-slate-400 font-semibold">Best For</th>
                <th class="text-left py-3 px-4 text-slate-400 font-semibold">What to Expect</th>
              </tr>
            </thead>
            <tbody>
              <!-- Bearish Scenario -->
              <tr class="border-b border-slate-800 hover:bg-red-500/5">
                <td class="py-4 px-4">
                  <span class="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-semibold">
                    ${scenarios.bearish.direction}
                  </span>
                </td>
                <td class="py-4 px-4 text-slate-300">${scenarios.bearish.entry}</td>
                <td class="py-4 px-4 text-slate-300">${scenarios.bearish.stop}</td>
                <td class="py-4 px-4">
                  <div class="text-slate-300">${scenarios.bearish.target1.price}</div>
                  <div class="text-xs text-cyan-400">${scenarios.bearish.target1.rr}</div>
                </td>
                <td class="py-4 px-4">
                  <div class="text-slate-300">${scenarios.bearish.target2.price}</div>
                  <div class="text-xs text-cyan-400">${scenarios.bearish.target2.rr}</div>
                </td>
                <td class="py-4 px-4">
                  <span class="px-2 py-1 ${this.getConfidenceBadgeClass(scenarios.bearish.confidence)} rounded text-xs font-semibold">
                    ${scenarios.bearish.confidence}
                  </span>
                </td>
                <td class="py-4 px-4 text-slate-400 text-xs">${scenarios.bearish.bestFor}</td>
                <td class="py-4 px-4 text-slate-400 text-xs">${scenarios.bearish.whatToExpect}</td>
              </tr>
              
              <!-- Bullish Scenario -->
              <tr class="hover:bg-green-500/5">
                <td class="py-4 px-4">
                  <span class="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-semibold">
                    ${scenarios.bullish.direction}
                  </span>
                </td>
                <td class="py-4 px-4 text-slate-300">${scenarios.bullish.entry}</td>
                <td class="py-4 px-4 text-slate-300">${scenarios.bullish.stop}</td>
                <td class="py-4 px-4">
                  <div class="text-slate-300">${scenarios.bullish.target1.price}</div>
                  <div class="text-xs text-cyan-400">${scenarios.bullish.target1.rr}</div>
                </td>
                <td class="py-4 px-4">
                  <div class="text-slate-300">${scenarios.bullish.target2.price}</div>
                  <div class="text-xs text-cyan-400">${scenarios.bullish.target2.rr}</div>
                </td>
                <td class="py-4 px-4">
                  <span class="px-2 py-1 ${this.getConfidenceBadgeClass(scenarios.bullish.confidence)} rounded text-xs font-semibold">
                    ${scenarios.bullish.confidence}
                  </span>
                </td>
                <td class="py-4 px-4 text-slate-400 text-xs">${scenarios.bullish.bestFor}</td>
                <td class="py-4 px-4 text-slate-400 text-xs">${scenarios.bullish.whatToExpect}</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- No-Trade Zone -->
        <div class="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <div class="flex items-start gap-3">
            <span class="text-2xl">⚠️</span>
            <div>
              <div class="font-semibold text-yellow-400 mb-1">No-Trade Zone: ${scenarios.noTradeZone.range}</div>
              <p class="text-sm text-slate-400">${scenarios.noTradeZone.advice}</p>
            </div>
          </div>
        </div>
      </div>
    `;
    }

    renderEducationalContent(analysis) {
        const { education } = analysis;

        return `
      <div class="glass-card p-6 bg-gradient-to-br from-purple-500/5 to-cyan-500/5">
        <h3 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span>📚</span> ${education.title}
        </h3>
        
        <div class="space-y-4">
          ${education.concepts.map(concept => `
            <div class="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <div class="flex items-start gap-3">
                <span class="text-xl">💡</span>
                <div class="flex-1">
                  <div class="font-semibold text-cyan-400 mb-1">
                    ${concept.term}
                  </div>
                  <p class="text-sm text-slate-300 mb-2">${concept.explanation}</p>
                  <div class="text-xs text-slate-500">Current level: ${concept.currentLevel}</div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
        
        <div class="mt-4 p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
          <div class="flex items-start gap-3">
            <span class="text-xl">⚡</span>
            <div>
              <div class="font-semibold text-orange-400 mb-1">Risk lesson:</div>
              <p class="text-sm text-slate-300">${education.riskLesson}</p>
            </div>
          </div>
        </div>
      </div>
    `;
    }

    renderBigPicture(analysis) {
        const { bigPicture } = analysis;

        return `
      <div class="glass-card p-6 border-l-4 border-purple-500">
        <h3 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span>🔍</span> The Big Picture: Wait for the Break
        </h3>
        
        <div class="space-y-3">
          <div class="flex items-start gap-3">
            <span class="text-lg">📊</span>
            <div>
              <div class="font-semibold text-purple-400 mb-1">${bigPicture.currentBias}</div>
              <p class="text-sm text-slate-400">${bigPicture.bearishConfirmation}</p>
            </div>
          </div>
          
          <div class="flex items-start gap-3">
            <span class="text-lg">🚀</span>
            <div>
              <div class="font-semibold text-green-400 mb-1">Bullish reversal?</div>
              <p class="text-sm text-slate-400">${bigPicture.bullishReversal}</p>
            </div>
          </div>
          
          <div class="mt-4 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
            <div class="flex items-start gap-3">
              <span class="text-xl">🎓</span>
              <div>
                <div class="font-semibold text-cyan-400 mb-1">Key lesson:</div>
                <p class="text-sm text-slate-300">${bigPicture.keyLesson}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    }

    renderSupportResistanceZones(analysis) {
        if (!analysis.zones) return '';
        
        const { zones, levels } = analysis;
        
        return `
      <div class="glass-card p-6">
        <h3 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span>📍</span> Key Support & Resistance Zones
        </h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Resistance Zones -->
          <div class="bg-red-500/5 border border-red-500/20 rounded-lg p-4">
            <h4 class="text-sm font-semibold text-red-400 mb-3 flex items-center gap-2">
              <span>⬆️</span> Resistance Levels
            </h4>
            <div class="space-y-2">
              ${zones.resistance.length > 0 ? zones.resistance.map((level, i) => `
                <div class="flex items-center justify-between text-sm">
                  <span class="text-slate-400">R${i + 1}:</span>
                  <span class="font-mono text-red-400">$${level.toFixed(2)}</span>
                  <span class="text-xs text-slate-500">
                    +${((level / levels.current - 1) * 100).toFixed(1)}%
                  </span>
                </div>
              `).join('') : '<p class="text-sm text-slate-500">No strong resistance detected</p>'}
            </div>
          </div>
          
          <!-- Support Zones -->
          <div class="bg-green-500/5 border border-green-500/20 rounded-lg p-4">
            <h4 class="text-sm font-semibold text-green-400 mb-3 flex items-center gap-2">
              <span>⬇️</span> Support Levels
            </h4>
            <div class="space-y-2">
              ${zones.support.length > 0 ? zones.support.map((level, i) => `
                <div class="flex items-center justify-between text-sm">
                  <span class="text-slate-400">S${i + 1}:</span>
                  <span class="font-mono text-green-400">$${level.toFixed(2)}</span>
                  <span class="text-xs text-slate-500">
                    ${((level / levels.current - 1) * 100).toFixed(1)}%
                  </span>
                </div>
              `).join('') : '<p class="text-sm text-slate-500">No strong support detected</p>'}
            </div>
          </div>
        </div>
      </div>
    `;
    }

    renderMultiTimeframePrompt(analysis) {
        return `
      <div class="glass-card p-6 bg-gradient-to-r from-cyan-500/5 to-purple-500/5 border-l-4 border-cyan-500">
        <div class="flex items-start gap-4">
          <span class="text-3xl">👆</span>
          <div class="flex-1">
            <h3 class="text-lg font-semibold text-white mb-2">
              Want me to analyze ${analysis.symbol}'s 1-hour or weekly chart for deeper trade timing and trend context?
            </h3>
            <p class="text-sm text-slate-400 mb-3">
              Use the timeframe selector above to switch between 1H, 4H, 1D, and 1W charts for comprehensive multi-timeframe analysis.
            </p>
            <div class="text-xs text-slate-500 italic">
              This content is for informational purposes only and not investment advice.
            </div>
          </div>
        </div>
      </div>
    `;
    }

    // ═══════════════════════════════════════════════════════════════
    // HELPER FUNCTIONS
    // ═══════════════════════════════════════════════════════════════

    getConfidenceBadgeClass(confidence) {
        switch (confidence) {
            case 'High':
                return 'bg-green-500/20 text-green-400';
            case 'Medium':
                return 'bg-yellow-500/20 text-yellow-400';
            case 'Low':
                return 'bg-red-500/20 text-red-400';
            default:
                return 'bg-slate-500/20 text-slate-400';
        }
    }

    // Export analysis as text
    exportAsText() {
        if (!this.currentAnalysis) return '';

        const { symbol, summary, scenarios, bigPicture } = this.currentAnalysis;

        return `
${symbol} Technical Analysis
${'='.repeat(50)}

SUMMARY:
${summary}

SCENARIO PLAYBOOK:
Bearish: ${scenarios.bearish.entry} → Stop: ${scenarios.bearish.stop} → Target: ${scenarios.bearish.target1.price} (${scenarios.bearish.target1.rr})
Bullish: ${scenarios.bullish.entry} → Stop: ${scenarios.bullish.stop} → Target: ${scenarios.bullish.target1.price} (${scenarios.bullish.target1.rr})

THE BIG PICTURE:
${bigPicture.keyLesson}

Generated: ${new Date().toLocaleString()}
    `.trim();
    }
}

// ═══════════════════════════════════════════════════════════════
// EXPORT & INITIALIZATION
// ═══════════════════════════════════════════════════════════════

window.TechnicalAnalysisUI = new TechnicalAnalysisUI();

console.log('✅ Technical Analysis UI loaded');
console.log('💡 Usage: TechnicalAnalysisUI.renderAnalysis("AAPL", "container-id", "1D")');
