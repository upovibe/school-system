import "@/components/ui/Skeleton.js";

/**
 * Event List Skeleton Loader Component
 *
 * A skeleton loader that replicates the exact design of the EventList component.
 * Used to show loading state while events data is being fetched.
 */
class EventListSkeleton extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.render();
  }

  render() {
    this.innerHTML = `
            <div class="space-y-4">
                 <!-- Simple Event Card Skeletons -->
                        <ui-skeleton type="card" width="100%" height="100px"></ui-skeleton>
                        <ui-skeleton type="card" width="100%" height="100px"></ui-skeleton>
                        <ui-skeleton type="card" width="100%" height="100px"></ui-skeleton>
            </div>
        `;
  }
}

customElements.define("event-list-skeleton", EventListSkeleton);
export default EventListSkeleton;
