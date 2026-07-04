interface HelpModalProps {
  onClose: () => void
}

export default function HelpModal({ onClose }: HelpModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>About CYTrainer</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <p>
            <strong>CYTrainer</strong> is a web-based playground for experimenting
            with a <strong>Cython fork</strong> that includes significant
            improvements over the upstream compiler. Write Python and Cython code
            in the editor, compile it, and inspect the generated C/C++ source.
          </p>

          <h3>Cython Fork</h3>
          <p>
            This application runs a fork of Cython available at{' '}
            <a href="https://github.com/jairov4/cython-ngen" target="_blank" rel="noopener">
              github.com/jairov4/cython-ngen
            </a>, which incorporates the enhancements proposed in{' '}
            <a href="https://github.com/cython/cython/pull/7740" target="_blank" rel="noopener">
              cython/cython#7740
            </a>.
          </p>

          <h4>Key improvements</h4>
          <ul>
            <li><strong>noexcept inference</strong> — automatically infers <code>noexcept</code> for methods when possible</li>
            <li><strong>__init__ optimization</strong> — optimized initialization methods for cdef classes</li>
            <li><strong>Value type support</strong> — new <code>@value_type</code> decorator for stack-allocated C++ value types</li>
            <li><strong>LTO</strong> — Link TOgether Optimization, enables cross-module inlining and optimization</li>
            <li><strong>cpdef classmethods</strong> — support for <code>cpdef</code> on classmethods</li>
            <li><strong>No boilerplate for non-Python subclassing</strong> — eliminates unnecessary Python boilerplate when <code>python_subclassing</code> is disabled</li>
            <li><strong>cpdef with closures, generators and lambdas</strong> — works correctly in the presence of nested functions</li>
            <li><strong>Dunder and binary op optimization</strong> — optimized dispatch for special methods and binary operators</li>
            <li><strong>cclass Enums</strong> — support for Cython enums on <code>cclass</code> types</li>
          </ul>

          <h3>How it works</h3>
          <ul>
            <li>Each session has its own project workspace stored on the server.</li>
            <li>Create <code>.py</code> or <code>.pyx</code> files in the file explorer (left panel).</li>
            <li>Edit them in the center panel — changes auto-save after 600ms.</li>
            <li>Toggle Cython directives using the checkboxes in the toolbar.</li>
            <li>Press <strong>Compile</strong> to transpile all source files to C/C++.</li>
            <li>The generated code appears in the right panel (read-only).</li>
            <li>Browse function symbols (<code>__pyx_f_</code>, <code>__pyx_pf_</code>, <code>__pyx_pw_</code>) and struct definitions in the panels below the generated code.</li>
          </ul>

          <h3>Directives</h3>
          <ul>
            <li><code>cimport_from_pyx</code> — allows importing from <code>.pyx</code> files</li>
            <li><code>auto_cpdef</code> — automatically declares functions as <code>cpdef</code></li>
            <li><code>lto</code> — enables link-time optimization</li>
            <li><code>infer_noexcept</code> — infers <code>noexcept</code> where possible</li>
            <li><code>python_subclassing</code> — allows Python subclassing of cdef classes</li>
          </ul>

          <h3>Demo</h3>
          <p>
            Press the <strong>Demo</strong> button to load a complete example
            project with a Cython <code>cclass</code> using value types and
            directives. It compiles automatically and lets you inspect the
            generated C code.
          </p>
        </div>
      </div>
    </div>
  )
}
