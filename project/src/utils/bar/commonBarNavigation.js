const DISPLAY_DEFAULTS = {
  weight: 1,
  mobileWeight: 1,
  weightIconOnly: 0.6,
  mobileWeightIconOnly: 0.55,
  fontSize: 1.2,
  mobileFontSize: 1.2,
  isPseudo: false,
  hideOnMobile: false,
  hideLabelOnMobile: false,
  showLabelOnlyWhenActive: false,
  mobileShowLabelOnlyWhenActive: true,
  cssClass: '',
  visibleWhen: null,
  scroll: undefined // undefined = 主tab; 'left' = 左侧溢出; 'right' = 右侧溢出
}

const NAVIGATION_DEFAULTS = {
  defaultTo: null,
  activeValue: null,
  activeMatch: null,
  rememberChild: false,
  defaultChild: null,
  children: [],
  syncFromRoute: true
}

const SCHEMA_DEFAULTS = {
  meta: {
    id: 'default',
    storage: {
      enabled: false,
      type: 'session',
      keyPrefix: 'commonbar'
    }
  },
  route: {
    activeResolver: null
  },
  display: {
    defaults: {},
    presets: {}
  },
  items: []
}

const normalizeDisplay = (schema, display = {}) => {
  const presetName = display.preset || 'standard'
  const preset = schema.display?.presets?.[presetName] || {}
  const directDisplay = { ...display }
  delete directDisplay.preset
  delete directDisplay.overrides

  return {
    ...DISPLAY_DEFAULTS,
    ...(schema.display?.defaults || {}),
    ...preset,
    ...directDisplay,
    ...(display.overrides || {})
  }
}

const normalizeNavigation = (navigation = {}) => ({
  ...NAVIGATION_DEFAULTS,
  ...navigation,
  children: navigation.children || []
})

export const createCommonBarItem = ({
  id,
  label,
  icon = '',
  display,
  navigation,
  meta = {}
}) => ({
  id,
  label,
  icon,
  display,
  navigation,
  meta
})

export const createCommonBarSchema = (schema = {}) => ({
  ...SCHEMA_DEFAULTS,
  ...schema,
  meta: {
    ...SCHEMA_DEFAULTS.meta,
    ...(schema.meta || {}),
    storage: {
      ...SCHEMA_DEFAULTS.meta.storage,
      ...(schema.meta?.storage || {})
    }
  },
  route: {
    ...SCHEMA_DEFAULTS.route,
    ...(schema.route || {})
  },
  display: {
    ...SCHEMA_DEFAULTS.display,
    ...(schema.display || {}),
    defaults: {
      ...SCHEMA_DEFAULTS.display.defaults,
      ...(schema.display?.defaults || {})
    },
    presets: {
      ...SCHEMA_DEFAULTS.display.presets,
      ...(schema.display?.presets || {})
    }
  },
  items: schema.items || []
})

export const normalizeCommonBarSchema = (schema) => {
  const normalizedSchema = createCommonBarSchema(schema)

  return {
    ...normalizedSchema,
    items: normalizedSchema.items.map((item) => {
      const tab = item.tab || item.id
      return {
        ...item,
        tab,
        display: normalizeDisplay(normalizedSchema, item.display),
        navigation: normalizeNavigation(item.navigation)
      }
    })
  }
}

export const getCommonBarTabs = (schema) => {
  const normalizedSchema = normalizeCommonBarSchema(schema)

  return normalizedSchema.items.map((item) => ({
    tab: item.tab,
    label: item.label,
    icon: item.icon,
    to: item.navigation.defaultTo,
    navigation: item.navigation,
    meta: item.meta || {},
    ...item.display
  }))
}

export const filterVisibleCommonBarTabs = (tabs) => tabs.filter((tab) => {
  if (typeof tab.visibleWhen === 'function') {
    return tab.visibleWhen()
  }
  return true
})

export const getCommonBarChildren = (schema, tabKey) => {
  const normalizedSchema = normalizeCommonBarSchema(schema)
  return normalizedSchema.items.find((item) => item.tab === tabKey)?.navigation?.children || []
}

export const matchCommonBarRoute = (target, route, router) => {
  if (!target) return false

  const resolved = router.resolve(target)
  if (resolved.path !== route.path) {
    return false
  }

  const targetQuery = resolved.query || {}
  const routeQuery = route.query || {}

  return Object.keys(targetQuery).every((key) => routeQuery[key] === targetQuery[key])
}

const matchesActiveResolver = (schema, tab, route) => {
  const resolver = schema.route?.activeResolver
  if (!resolver) return false

  if (typeof resolver === 'function') {
    return resolver({ tab, route })
  }

  if (resolver.type === 'query' && resolver.tabKey) {
    const expectedValue = tab.navigation?.activeValue || tab.tab
    return route.query?.[resolver.tabKey] === expectedValue
  }

  if (resolver.type === 'path') {
    const expectedPath = tab.navigation?.activeValue || tab.to
    return route.path === expectedPath
  }

  return false
}

export const getCommonBarActiveTab = (schema, route, router) => {
  const tabs = getCommonBarTabs(schema)

  for (const tab of tabs) {
    if (typeof tab.navigation?.activeMatch === 'function' && tab.navigation.activeMatch({ route, router, tab })) {
      return tab.tab
    }

    if (matchCommonBarRoute(tab.to, route, router)) {
      return tab.tab
    }

    if ((tab.navigation?.children || []).some((child) => matchCommonBarRoute(child.path, route, router))) {
      return tab.tab
    }

    if (matchesActiveResolver(normalizeCommonBarSchema(schema), tab, route)) {
      return tab.tab
    }
  }

  return null
}

export const getCommonBarMemoryKey = (schema, tabKey) => {
  const normalizedSchema = normalizeCommonBarSchema(schema)
  const prefix = normalizedSchema.meta?.storage?.keyPrefix || 'commonbar'
  const id = normalizedSchema.meta?.id || 'default'
  return `${prefix}:${id}:${tabKey}`
}

const getStorage = (schema) => {
  const normalizedSchema = normalizeCommonBarSchema(schema)
  const storageType = normalizedSchema.meta?.storage?.type

  if (storageType === 'local' && typeof window !== 'undefined') {
    return window.localStorage
  }

  if (typeof window !== 'undefined') {
    return window.sessionStorage
  }

  return null
}

export const readCommonBarMemory = (schema, tabKey) => {
  const normalizedSchema = normalizeCommonBarSchema(schema)
  if (!normalizedSchema.meta?.storage?.enabled) return null

  const storage = getStorage(normalizedSchema)
  if (!storage) return null

  return storage.getItem(getCommonBarMemoryKey(normalizedSchema, tabKey))
}

export const writeCommonBarMemory = (schema, tabKey, path) => {
  const normalizedSchema = normalizeCommonBarSchema(schema)
  if (!normalizedSchema.meta?.storage?.enabled || !path) return

  const storage = getStorage(normalizedSchema)
  if (!storage) return

  storage.setItem(getCommonBarMemoryKey(normalizedSchema, tabKey), path)
}

export const resolveCommonBarTabTarget = (schema, tab) => {
  const rememberedPath = readCommonBarMemory(schema, tab.tab)
  const childPaths = (tab.navigation?.children || []).map((child) => child.path)

  if (tab.navigation?.rememberChild && rememberedPath && childPaths.includes(rememberedPath)) {
    return rememberedPath
  }

  if (tab.navigation?.rememberChild && tab.navigation?.defaultChild) {
    return tab.navigation.defaultChild
  }

  return tab.to
}

export const syncCommonBarMemoryFromRoute = (schema, route, router) => {
  const normalizedSchema = normalizeCommonBarSchema(schema)
  const tab = normalizedSchema.items.find((item) => {
    if (!item.navigation?.rememberChild || item.navigation?.syncFromRoute === false) {
      return false
    }

    return item.navigation.children.some((child) => matchCommonBarRoute(child.path, route, router))
  })

  if (!tab) return

  const matchedChild = tab.navigation.children.find((child) => matchCommonBarRoute(child.path, route, router))
  if (!matchedChild?.path) return

  writeCommonBarMemory(normalizedSchema, tab.tab, matchedChild.path)
}
