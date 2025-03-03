import { OutFile } from './OutFile.ts'
import { parseTypeWithHole } from './parseTypeWithHole.ts'
import { resolveRelativePath } from './resolveRelativePath.ts'

export type Registry = Map<string, [holeIndex: number, fn: string]>

export interface Registries {
  covariant: Registry
  foldable: Registry
  traversable: Registry
  typeLambda: Registry
}

export interface RegistryFlags {
  covariant: string[]
  foldable: string[]
  traversable: string[]
  typeLambda: string[]
}

const parseCovariantFlags = createInstanceFlagsParser('--covariant', 'Covariant', true, 'map')
const parseFoldableFlags = createInstanceFlagsParser('--foldable', 'Foldable', true, 'reduce')
const parseTraversableFlags = createInstanceFlagsParser('--traversable', 'Traversable', true, 'traverse')
const parseTypeLambdaFlags = createInstanceFlagsParser('--type-lambda', 'TypeLambda', false, '', true)

export function parseRegistryFlags(
  cwd: string,
  inFilePath: string,
  outFilePath: string,
  flags: RegistryFlags
): [Registries, OutFile] {
  const outFile = new OutFile()

  const [covariant, outFile1] = parseCovariantFlags(cwd, inFilePath, outFilePath, flags.covariant)
  const [foldable, outFile2] = parseFoldableFlags(cwd, inFilePath, outFilePath, flags.foldable)
  const [traversable, outFile3] = parseTraversableFlags(cwd, inFilePath, outFilePath, flags.traversable)
  const [typeLambda, outFile4] = parseTypeLambdaFlags(cwd, inFilePath, outFilePath, flags.typeLambda)

  const registries = {
    covariant,
    foldable,
    traversable,
    typeLambda
  }

  return [registries, outFile.merge(outFile1).merge(outFile2).merge(outFile3).merge(outFile4)]
}

function createInstanceFlagsParser(
  flagName: string,
  instance: string,
  expectHole: boolean,
  fn: string,
  typeOnly = false
): (cwd: string, inFilePath: string, outFilePath: string, flags: string[]) => [Registry, OutFile] {
  return (cwd, inFilePath, outFilePath, flags) => {
    const registry: Registry = new Map()
    const outFile = new OutFile()

    for (const flag of flags) {
      const parts = flag.split('#')
      if (parts.length < 2) {
        throw new Error(`Failed to parse ${flagName} flag: expected at least an import path and a type name`)
      } else if (parts.length > 3) {
        throw new Error(
          `Failed to parse ${flagName} flag: expected at most an import path, an import name, and a type name`
        )
      }

      let importPath: string = parts[0]
      let importName: string | null = null
      let tyName: string

      if (parts.length === 2) {
        tyName = parts[1]
      } else {
        importName = parts[1]
        tyName = parts[2]
      }

      const [name, holeIndex] = parseTypeWithHole(tyName, expectHole)

      if (registry.has(name)) {
        throw new Error(`${flagName} flag for type name ${tyName} was already provided`)
      }
      registry.set(name, [holeIndex, `${name}${instance}.${fn}`])

      if (!importPath.startsWith('.')) {
        if (importName == null) {
          outFile.addPackageDefaultImport(importPath, name + instance, typeOnly)
        } else {
          outFile.addPackageImport(importPath, importName, name + instance, typeOnly)
        }
      } else {
        importPath = resolveRelativePath(cwd, inFilePath, outFilePath, importPath)
        if (importName == null) {
          outFile.addLocalDefaultImport(importPath, name + instance, typeOnly)
        } else {
          outFile.addLocalImport(importPath, importName, name + instance, typeOnly)
        }
      }
    }

    return [registry, outFile]
  }
}
