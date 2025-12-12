/**
 * @file Implements a virtualized list for rendering large datasets efficiently.
 * @class
 */
export default class VirtualList {
    /**
     * Creates an instance of VirtualList.
     * @param {HTMLElement} container - The scrollable container element for the list.
     * @param {Array<object>} items - The full list of items to render.
     * @param {function(object): HTMLElement} rowRenderer - A function that takes an item and returns the DOM element for its row.
     * @param {number} rowHeight - The fixed height of each row in pixels.
     * @param {number} [spacing=0] - The space between rows in pixels.
     */
    constructor(container, items, rowRenderer, rowHeight, spacing = 0) {
        this.container = container;
        this.allItems = items; // Store the original, unfiltered list
        this.items = items;
        this.rowRenderer = rowRenderer;
        this.rowHeight = rowHeight;
        this.spacing = spacing;
        this.renderedItems = new Map(); // Stores the DOM node for each rendered item's index
        this._calculateTotalHeight();

        this.container.style.position = 'relative';
        this.container.style.overflowY = 'auto';

        this.content = document.createElement('div');
        this.content.style.height = `${this.totalHeight}px`;
        this.content.style.position = 'relative';
        this.container.innerHTML = '';
        this.container.appendChild(this.content);

        this.onScroll = this.onScroll.bind(this);
        this.container.addEventListener('scroll', this.onScroll);

        this.render();
    }
    /**
     * Calculates the total height of the scrollable content area.
     * @private
     */
    _calculateTotalHeight() {
        if (this.items.length === 0) {
            this.totalHeight = 0;
            return;
        }
        this.totalHeight = this.items.length * this.rowHeight + (this.items.length - 1) * this.spacing;
    }

    /**
     * Renders the visible items in the list based on the current scroll position.
     * It adds new visible items to the DOM and removes items that are no longer visible.
     */
    render() {
        const scrollTop = this.container.scrollTop;
        const containerHeight = this.container.clientHeight;
        const rowHeightWithSpacing = this.rowHeight + this.spacing;

        const startIndex = Math.max(0, Math.floor(scrollTop / rowHeightWithSpacing));
        const endIndex = Math.min(this.items.length - 1, startIndex + Math.ceil(containerHeight / rowHeightWithSpacing));

        const visibleIndices = new Set();
        for (let i = startIndex; i <= endIndex; i++) {
            visibleIndices.add(i);
        }

        // Remove items that are no longer visible
        for (const [index, node] of this.renderedItems.entries()) {
            if (!visibleIndices.has(index)) {
                this.content.removeChild(node);
                this.renderedItems.delete(index);
            }
        }

        // Add new items that are now visible
        for (let i = startIndex; i <= endIndex; i++) {
            if (!this.renderedItems.has(i)) {
                const item = this.items[i];
                const node = this.rowRenderer(item);
                node.style.position = 'absolute';
                node.style.top = `${i * rowHeightWithSpacing}px`;
                node.style.width = '100%';
                node.style.height = `${this.rowHeight}px`;

                this.content.appendChild(node);
                this.renderedItems.set(i, node);
            }
        }
    }

    /**
     * Handles the scroll event on the container, triggering a re-render.
     */
    onScroll() {
        requestAnimationFrame(() => this.render());
    }

    /**
     * Cleans up event listeners when the list is no longer needed.
     */
    destroy() {
        this.container.removeEventListener('scroll', this.onScroll);
        this.container.innerHTML = '';
        this.renderedItems.clear();
    }

    /**
     * Updates the list with a new set of items and re-renders.
     * @param {Array<object>} newItems - The new list of items.
     */
    updateItems(newItems) {
        this.items = newItems;
        this._calculateTotalHeight();
        this.content.style.height = `${this.totalHeight}px`;

        // Clear existing rendered items before re-rendering
        for (const node of this.renderedItems.values()) {
            if (node.parentNode === this.content) {
                this.content.removeChild(node);
            }
        }
        this.renderedItems.clear();
        this.render();
    }

    /**
     * Filters the list based on a search query and triggers a re-render.
     * @param {string} query - The search query.
     */
    search(query) {
        const lowerCaseQuery = query.toLowerCase();
        const filteredItems = this.allItems.filter(item => {
            const name = (item.name_raw || item.name || '').toLowerCase();
            return name.includes(lowerCaseQuery);
        });

        this.updateItems(filteredItems);
    }
}
