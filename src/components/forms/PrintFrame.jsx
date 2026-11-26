export default function PrintFrame({ margin, children }) {
  return (
    <table className="kp-frame" style={{ '--kp-margin': margin }}>
      <thead>
        <tr>
          <td />
        </tr>
      </thead>
      <tfoot>
        <tr>
          <td />
        </tr>
      </tfoot>
      <tbody>
        <tr>
          <td>{children}</td>
        </tr>
      </tbody>
    </table>
  )
}
