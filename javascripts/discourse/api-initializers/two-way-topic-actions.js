import { apiInitializer } from "discourse/lib/api";

function enhanceTopicActions() {
  const body = document.body;
  const topicPost = document.querySelector(".topic-post");
  const topicMap = topicPost?.querySelector(".topic-map");
  const postControls = topicPost?.querySelector(".post-controls");
  const actions = postControls?.querySelector(".actions");
  const topicFooter = document.querySelector(
    '[aria-label="Topic actions"] .topic-footer-main-buttons'
  );
  const footerActions = topicFooter?.querySelector(".topic-footer-main-buttons__actions");

  if (!topicPost || !topicMap || !postControls || !actions) {
    body?.classList.remove("two-way-topic-actions-enhanced");
    return;
  }

  topicMap.appendChild(postControls);

  const selectorsToMove = [
    ".bookmark-menu__trigger",
    ".flag-topic",
    ".topic-admin-menu-trigger",
  ];

  selectorsToMove.forEach((selector) => {
    const button = footerActions?.querySelector(selector);

    if (button && !actions.contains(button)) {
      actions.appendChild(button);
    }
  });

  body.classList.add("two-way-topic-actions-enhanced");
}

export default apiInitializer("1.8.0", (api) => {
  const run = () => requestAnimationFrame(enhanceTopicActions);

  api.onPageChange(() => {
    run();

    const observer = new MutationObserver(() => run());
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    setTimeout(() => observer.disconnect(), 3000);
  });
});
