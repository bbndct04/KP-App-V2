export const FORM_CSS = `
.kp-paper{background:#fff;color:#000;font-family:'Times New Roman',Times,serif;font-size:12pt;line-height:1.5;position:relative;box-sizing:border-box}
.kp-center{text-align:center}
.kp-bold{font-weight:700}
.kp-para{text-align:justify;margin:12px 0}
.kp-title{text-align:center;font-weight:700;letter-spacing:.45em;padding-left:.45em;margin:22px 0 12px}
.kp-caption{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,.85fr);gap:28px;margin-top:22px}
.kp-name{border-bottom:1px solid #000;text-align:center;min-height:26px;padding:0 4px}
.kp-label{text-align:center;font-size:10.5pt}
.kp-against{margin:10px 0}
.kp-u{display:inline-block;border-bottom:1px solid #000;text-align:center;padding:0 2px;line-height:1.25}
.kp-ruled{line-height:28px;background-image:repeating-linear-gradient(to bottom,transparent 0,transparent 27px,#000 27px,#000 28px);white-space:pre-wrap;text-align:justify;margin:6px 0 14px}
.kp-sig{margin-top:40px;break-inside:avoid}
.kp-sig-line{border-bottom:1px solid #000;height:1px}
.kp-sig-name{font-weight:700;text-align:center;text-transform:uppercase}
.kp-sig-label{text-align:center;font-size:10.5pt}
.kp-avoid{break-inside:avoid}
.kp-break{break-before:page;margin-top:40px}
.kp-small{font-size:10.5pt;line-height:1.7}
.kp-watermark{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none;overflow:hidden;font-size:140px;font-weight:700;letter-spacing:.08em;color:rgba(0,0,0,.06);transform:rotate(-28deg)}
.kp-ed{display:inline-block;min-width:3ch;outline:1px dashed #185FA5;background:rgba(230,241,251,.85);border-radius:2px;cursor:text}
.kp-ed:focus{outline:2px solid #185FA5}
.kp-ed:empty::before{content:attr(data-placeholder);color:#6b7a90}
.kp-ed-block{display:block;white-space:pre-wrap;background:transparent;min-height:28px}
.kp-date{font:inherit;border:1px dashed #185FA5;background:rgba(230,241,251,.85);border-radius:2px;padding:0 4px}
@media print{
  .kp-noprint{display:none !important}
  .kp-page-bg{background:#fff !important;padding:0 !important}
  .kp-fit-wrap{height:auto !important}
  .kp-fit{transform:none !important;width:auto !important}
  .kp-paper{border:0 !important;padding:0 !important;min-height:0 !important}
  .kp-ed,.kp-date{outline:none !important;background:transparent !important;border:0 !important}
}
`
