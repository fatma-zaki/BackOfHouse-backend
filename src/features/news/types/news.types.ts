export type NewsStoryStatusId = 'draft' | 'published' | 'scheduled'

export type NewsTabId = 'all' | 'published' | 'scheduled' | 'drafts'

export type NewsEditorLocale = 'en' | 'ar'

export type NewsCategoryId =
  | 'opportunities'
  | 'culture'
  | 'safety'
  | 'community'

export type NewsStoryContent = {
  headline: string
  body: string
}

export type NewsStory = {
  id: string
  titleKey: string
  statusId: NewsStoryStatusId
  /** i18n key for list meta (author, reads, schedule hint) */
  metaKey: string
  thumbnailClass: string
  coverClass: string
  /** Optional photo cover; falls back to `coverClass` gradient. */
  coverImageUrl?: string
  /** Optional list thumbnail; falls back to `thumbnailClass` gradient. */
  thumbnailImageUrl?: string
  categoryId: NewsCategoryId
  linkToKey: string
  notifyKey: string
  content: {
    en: NewsStoryContent
    ar: NewsStoryContent
  }
}

export type NewsStoriesData = {
  stories: readonly NewsStory[]
}
