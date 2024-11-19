export type IsTypeImport = boolean

export class OutFile {
  readonly packages = new Set<string>()
  readonly packageAsteriskImports = new Map<string, Map<string, IsTypeImport>>
  readonly packageImports = new Map<string, Map<string, IsTypeImport>>

  readonly localImports = new Map<string, Map<string, IsTypeImport>>

  declarations = ''

  addPackageAsteriskImport (module: string, alias: string, isTypeImport: boolean = false): this {
    this.packages.add(module)
    const imports = this.packageAsteriskImports.get(module) ?? new Map()
    this.packageAsteriskImports.set(module, imports)
    const existingAlias = imports.get(alias) ?? isTypeImport
    imports.set(alias, isTypeImport ? existingAlias : false)
    return this
  }

  addPackageImport (module: string, imported: string, isTypeImport: boolean = false): this {
    this.packages.add(module)
    const imports = this.packageImports.get(module) ?? new Map()
    this.packageImports.set(module, imports)
    const existingImport = imports.get(imported) ?? isTypeImport
    imports.set(imported, isTypeImport ? existingImport : false)
    return this
  }

  addLocalImport (module: string, imported: string, isTypeImport: boolean = false): this {
    const imports = this.localImports.get(module) ?? new Map()
    this.localImports.set(module, imports)
    const existingImport = imports.get(imported) ?? isTypeImport
    imports.set(imported, isTypeImport ? existingImport : false)
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

    for (const [module, imports] of other.packageImports) {
      for (const [imported, isTypeImport] of imports) {
        this.addPackageImport(module, imported, isTypeImport)
      }
    }

    for (const [module, imports] of other.localImports) {
      for (const [imported, isTypeImport] of imports) {
        this.addLocalImport(module, imported, isTypeImport)
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

      const imports = this.packageImports.get(module)
      if (imports != null && imports.size > 0) {
        out += 'import { '

        let i = 0;
        for (const [imported, isTypeImport] of imports) {
          out += `${i++ === 0 ? '' : ', '}${isTypeImport ? 'type ' : ''}${imported}`
        }
  
        out += ` } from "${module}"\n`
      }
    }

    if (this.packageImports.size > 0) out += '\n'

    for (const [module, imports] of this.localImports) {
      out += 'import { '

      let i = 0;
      for (const [imported, isTypeImport] of imports) {
        out += `${i++ === 0 ? '' : ', '}${isTypeImport ? 'type ' : ''}${imported}`
      }

      out += ` } from "${module}"\n`
    }

    if (this.localImports.size > 0) out += '\n'

    return out + this.declarations
  }
} 