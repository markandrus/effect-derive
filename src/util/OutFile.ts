export type IsTypeImport = boolean

export class OutFile {
  readonly packages = new Set<string>()
  readonly packageAsteriskImports = new Map<string, Map<string, IsTypeImport>>
  readonly packageDefaultImports = new Map<string, Map<string, IsTypeImport>>
  readonly packageImports = new Map<string, Map<string, [alias: string | undefined, IsTypeImport]>>

  readonly locals = new Set<string>()
  readonly localDefaultImports = new Map<string, Map<string, IsTypeImport>>
  readonly localImports = new Map<string, Map<string, [alias: string | undefined, IsTypeImport]>>

  declarations = ''

  addPackageAsteriskImport (module: string, alias: string, isTypeImport: boolean = false): this {
    this.packages.add(module)
    const imports = this.packageAsteriskImports.get(module) ?? new Map()
    this.packageAsteriskImports.set(module, imports)
    const existingAlias = imports.get(alias) ?? isTypeImport
    imports.set(alias, isTypeImport ? existingAlias : false)
    return this
  }

  addPackageDefaultImport (module: string, alias: string, isTypeImport: boolean = false): this {
    this.packages.add(module)
    const imports = this.packageDefaultImports.get(module) ?? new Map()
    this.packageDefaultImports.set(module, imports)
    const existingAlias = imports.get(alias) ?? isTypeImport
    imports.set(alias, isTypeImport ? existingAlias : false)
    return this
  }

  addPackageImport (module: string, imported: string, isTypeImport?: boolean): this
  addPackageImport (module: string, imported: string, alias?: string, isTypeImport?: boolean): this
  addPackageImport (module: string, imported: string, aliasOrIsTypeImport?: string | boolean, isTypeImport?: boolean): this {
    const alias = typeof aliasOrIsTypeImport === 'string' ? aliasOrIsTypeImport : undefined
    isTypeImport = typeof aliasOrIsTypeImport === 'boolean' ? aliasOrIsTypeImport : isTypeImport ?? false

    this.packages.add(module)
    const imports = this.packageImports.get(module) ?? new Map<string, [alias: string | undefined, IsTypeImport]>()
    this.packageImports.set(module, imports)
    const existingImport = imports.get(imported) ?? [alias, isTypeImport]
    if (existingImport[0] !== alias) {
      throw new Error('Multiple import aliases are not supported')
    }

    imports.set(imported, isTypeImport ? existingImport : [alias, false])

    return this
  }

  addLocalDefaultImport (module: string, alias: string, isTypeImport: boolean = false): this {
    this.locals.add(module)
    const imports = this.localDefaultImports.get(module) ?? new Map()
    this.localDefaultImports.set(module, imports)
    const existingAlias = imports.get(alias) ?? isTypeImport
    imports.set(alias, isTypeImport ? existingAlias : false)
    return this
  }

  addLocalImport (module: string, imported: string, isTypeImport?: boolean): this
  addLocalImport (module: string, imported: string, alias?: string, isTypeImport?: boolean): this
  addLocalImport (module: string, imported: string, aliasOrIsTypeImport?: string | boolean, isTypeImport?: boolean): this {
    const alias = typeof aliasOrIsTypeImport === 'string' ? aliasOrIsTypeImport : undefined
    isTypeImport = typeof aliasOrIsTypeImport === 'boolean' ? aliasOrIsTypeImport : isTypeImport ?? false

    this.locals.add(module)
    const imports = this.localImports.get(module) ?? new Map<string, [alias: string | undefined, IsTypeImport]>()
    this.localImports.set(module, imports)
    const existingImport = imports.get(imported) ?? [alias, isTypeImport]
    if (existingImport[0] !== alias) {
      throw new Error('Multiple import aliases are not supported')
    }

    imports.set(imported, isTypeImport ? existingImport : [alias, false])

    return this
  }

  addDeclarations (declarations: string): this {
    this.declarations += declarations
    return this
  }

  merge (other: OutFile): this {
    for (const [module, imports] of other.packageAsteriskImports) {
      for (const [alias, isTypeImport] of imports) {
        this.addPackageAsteriskImport(module, alias, isTypeImport)
      }
    }

    for (const [module, imports] of other.packageDefaultImports) {
      for (const [alias, isTypeImport] of imports) {
        this.addPackageDefaultImport(module, alias, isTypeImport)
      }
    }

    for (const [module, imports] of other.packageImports) {
      for (const [imported, [alias, isTypeImport]] of imports) {
        this.addPackageImport(module, imported, alias, isTypeImport)
      }
    }

    for (const [module, imports] of other.localDefaultImports) {
      for (const [imported, isTypeImport] of imports) {
        this.addLocalDefaultImport(module, imported, isTypeImport)
      }
    }

    for (const [module, imports] of other.localImports) {
      for (const [imported, [alias, isTypeImport]] of imports) {
        this.addLocalImport(module, imported, alias, isTypeImport)
      }
    }

    this.declarations += other.declarations

    return this
  }

  toString (): string {
    let out = ''

    const packages = Array.from(this.packages).sort()
    for (const module of packages) {
      const asteriskImports = this.packageAsteriskImports.get(module) ?? new Map()
      for (const [alias, isTypeImport] of asteriskImports) {
        out += `import ${isTypeImport ? 'type ' : ''}* as ${alias} from "${module}"\n`
      }

      const defaultImports = this.packageDefaultImports.get(module) ?? new Map()
      for (const [alias, isTypeImport] of defaultImports) {
        out += `import ${isTypeImport ? 'type ' : ''} ${alias} from "${module}"\n`
      }

      const imports = this.packageImports.get(module)
      if (imports != null && imports.size > 0) {
        out += 'import { '

        let i = 0;
        for (const [imported, [alias, isTypeImport]] of imports) {
          out += `${i++ === 0 ? '' : ', '}${isTypeImport ? 'type ' : ''}${imported}${alias == null ? '' : ` as ${alias}`}`
        }
  
        out += ` } from "${module}"\n`
      }
    }

    if (this.packageImports.size > 0) out += '\n'

    const locals = Array.from(this.locals).sort()
    for (const module of locals) {
      const defaultImports = this.localDefaultImports.get(module) ?? new Map()
      for (const [alias, isTypeImport] of defaultImports) {
        out += `import ${isTypeImport ? 'type ' : ''} ${alias} from "${module}"\n`
      }

      const imports = this.localImports.get(module)
      if (imports != null && imports.size > 0) {
        out += 'import { '

        let i = 0;
        for (const [imported, [alias, isTypeImport]] of imports) {
          out += `${i++ === 0 ? '' : ', '}${isTypeImport ? 'type ' : ''}${imported}${alias == null ? '' : ` as ${alias}`}`
        }
  
        out += ` } from "${module}"\n`
      }
    }

    if (this.localImports.size > 0) out += '\n'

    return out + this.declarations
  }
} 