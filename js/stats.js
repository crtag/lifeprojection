/**
 * Stats Display Manager
 * Updates the stats panel with population and game information
 */

export class StatsDisplay {
    constructor(gameEngine) {
        this.game = gameEngine;

        // Get DOM elements
        this.elements = {
            alive: document.getElementById('stat-alive'),
            total: document.getElementById('stat-total'),
            density: document.getElementById('stat-density'),
            tick: document.getElementById('stat-tick'),
            survival: document.getElementById('rule-survival'),
            birth: document.getElementById('rule-birth'),
            ageDeath: document.getElementById('rule-age-death'),
            suddenDeath: document.getElementById('rule-sudden-death')
        };

        // Initialize display
        this.update();
    }

    update() {
        const cells = this.game.getCells();
        const aliveCount = cells.filter(c => c.alive).length;
        const totalCount = cells.length;
        const density = totalCount > 0 ? (aliveCount / totalCount * 100).toFixed(1) : 0;
        const tick = this.game.getTickCount();

        // Update stats
        if (this.elements.alive) this.elements.alive.textContent = aliveCount.toLocaleString();
        if (this.elements.total) this.elements.total.textContent = totalCount.toLocaleString();
        if (this.elements.density) this.elements.density.textContent = `${density}%`;
        if (this.elements.tick) this.elements.tick.textContent = tick.toLocaleString();

        // Update all rules display
        this.updateRulesDisplay();
    }

    updateRulesDisplay() {
        // Update survival and birth rules
        const survivalRules = this.game.getSurvivalRules();
        const birthRules = this.game.getBirthRules();

        if (this.elements.survival) {
            let survivalText = `${survivalRules.minNeighbors}`;
            if (survivalRules.maxNeighbors !== survivalRules.minNeighbors) {
                survivalText += `-${survivalRules.maxNeighbors}`;
            }
            survivalText += ' neighbors';

            if (survivalRules.probabilityEnabled) {
                survivalText += ` (p: ${(survivalRules.probability * 100).toFixed(0)}%)`;
            }

            this.elements.survival.textContent = survivalText;
        }

        if (this.elements.birth) {
            let birthText = `${birthRules.minNeighbors}`;
            if (birthRules.maxNeighbors !== birthRules.minNeighbors) {
                birthText += `-${birthRules.maxNeighbors}`;
            }
            birthText += ' neighbors';

            if (birthRules.probabilityEnabled) {
                birthText += ` (p: ${(birthRules.probability * 100).toFixed(0)}%)`;
            }

            this.elements.birth.textContent = birthText;
        }

        // Update death rules
        this.updateDeathRules();
    }

    updateDeathRules() {
        const deathRules = this.game.getDeathRules();

        // Age-based death
        if (this.elements.ageDeath) {
            if (deathRules.ageDeathEnabled) {
                const ageText = `Enabled (threshold: ${deathRules.ageDeathThreshold}, λ: ${deathRules.ageDeathRate.toFixed(3)})`;
                this.elements.ageDeath.textContent = ageText;
            } else {
                this.elements.ageDeath.textContent = 'Disabled';
            }
        }

        // Sudden death
        if (this.elements.suddenDeath) {
            if (deathRules.suddenDeathEnabled) {
                const probText = `Enabled (p: ${(deathRules.suddenDeathProbability * 100).toFixed(2)}%)`;
                this.elements.suddenDeath.textContent = probText;
            } else {
                this.elements.suddenDeath.textContent = 'Disabled';
            }
        }
    }

}
