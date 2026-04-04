// CSS module declarations for TypeScript
declare module '*.css' {
  const styles: { readonly [key: string]: string }
  export default styles
}

// Side-effect CSS imports (globals.css)
declare module '*/globals.css'
declare module '../globals.css'
declare module './globals.css'
