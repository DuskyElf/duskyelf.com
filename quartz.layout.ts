import { PageLayout, SharedLayout } from "./quartz/cfg"
import * as Component from "./quartz/components"
import { SimpleSlug } from "./quartz/util/path"

// components shared across all pages
export const sharedPageComponents: SharedLayout = {
  head: Component.Head(),
  header: [
    Component.ConditionalRender({
      condition: (page) => page.fileData.slug === "index",
      component: Component.Search(),
    }),
    Component.ConditionalRender({
      condition: (page) => page.fileData.slug === "index",
      component: Component.Darkmode(),
    }),
  ],
  afterBody: [
    Component.ConditionalRender({
      condition: (page) => page.fileData.slug === "index",
      component: Component.RecentNotes({
        title: "Recent Notes",
        limit: 5,
        filter: (f) => f.slug!.startsWith("notes/"),
        linkToMore: "notes/" as SimpleSlug,
      }),
    }),
    Component.ConditionalRender({
      condition: (page) => page.fileData.slug === "index",
      component: Component.RecentNotes({
        title: "Recent Blogs",
        limit: 5,
        filter: (f) => f.slug!.startsWith("blogs/"),
        linkToMore: "blogs/" as SimpleSlug,
      }),
    }),
    Component.ConditionalRender({
      condition: (page) =>
        page.fileData.slug !== "index" &&
        page.fileData.filePath !== undefined &&
        page.fileData.slug!.startsWith("blogs/"),
      component: Component.SequoiaComments(),
    }),
    Component.ConditionalRender({
      condition: (page) => page.fileData.slug !== "index",
      component: Component.Graph(),
    }),
  ],
  footer: Component.Footer(),
}

const leftSidebarComponents = [
  Component.ConditionalRender({
    condition: (page) => page.fileData.slug !== "index",
    component: Component.PageTitle(),
  }),
  Component.ConditionalRender({
    condition: (page) => page.fileData.slug !== "index",
    component: Component.MobileOnly(Component.Spacer()),
  }),
  Component.ConditionalRender({
    condition: (page) => page.fileData.slug !== "index",
    component: Component.Flex({
      components: [
        { Component: Component.Search(), grow: true },
        { Component: Component.Darkmode() },
      ],
    }),
  }),
  Component.ConditionalRender({
    component: Component.DesktopOnly(
      Component.RecentNotes({ title: "Recent Writings", linkToMore: "/" as SimpleSlug }),
    ),
    condition: (page) => page.fileData.slug !== "index",
  }),
]

// components for pages that display a single page (e.g. a single note)
export const defaultContentPageLayout: PageLayout = {
  beforeBody: [
    Component.ConditionalRender({
      component: Component.ArticleTitle(),
      condition: (page) => page.fileData.slug !== "index",
    }),
    Component.ConditionalRender({
      component: Component.ContentMeta(),
      condition: (page) => page.fileData.slug !== "index",
    }),
    Component.TagList(),
  ],
  left: leftSidebarComponents,
  right: [
    Component.ConditionalRender({
      condition: (page) => page.fileData.slug !== "index",
      component: Component.DesktopOnly(Component.TableOfContents()),
    }),
    Component.ConditionalRender({
      condition: (page) => page.fileData.slug !== "index",
      component: Component.Backlinks(),
    }),
  ],
}

// components for pages that display lists of pages  (e.g. tags or folders)
export const defaultListPageLayout: PageLayout = {
  beforeBody: [Component.ArticleTitle(), Component.ContentMeta()],
  left: leftSidebarComponents,
  right: [],
}
