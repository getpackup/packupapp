// This template was adapted from an exported mailchimp email and includes features to
// progressively enhance for email clients that can support newer features,
// and degrade gracefully for email clients that dont

const inviteToTripEmail = ({
  greetingName,
  username,
  isTestEnv,
}: {
  greetingName: string
  username: string
  isTestEnv?: boolean
}): {
  htmlTemplate: string
  textOnlyTemplate: string
} => {
  const tripUrl = isTestEnv ? `https://test.packupapp.com/` : `https://packupapp.com/`
  return {
    htmlTemplate: `
<!DOCTYPE html>
<html
  xmlns="http://www.w3.org/1999/xhtml"
  xmlns:v="urn:schemas-microsoft-com:vml"
  xmlns:o="urn:schemas-microsoft-com:office:office"
>
  <head>
    <!--[if gte mso 15]>
      <xml>
        <o:OfficeDocumentSettings>
          <o:AllowPNG />
          <o:PixelsPerInch>96</o:PixelsPerInch>
        </o:OfficeDocumentSettings>
      </xml>
    <![endif]-->
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Packup</title>

     <!--[if (gte mso 9)|(IE)]><!-->
    <link rel="stylesheet" type="text/css" href="https://cloud.typography.com/7222118/6340832/css/fonts.css" media="all" />
    <!--<![endif]-->   

    <style type="text/css">
      p {
        margin: 10px 0;
        padding: 0;
      }
      table {
        border-collapse: collapse;
      }
      h1,
      h2,
      h3,
      h4,
      h5,
      h6 {
        display: block;
        margin: 0;
        padding: 0;
      }
      img,
      a img {
        border: 0;
        height: auto;
        outline: none;
        text-decoration: none;
      }
      body,
      #bodyTable,
      #bodyCell {
        height: 100%;
        margin: 0;
        padding: 0;
        width: 100%;
        font-family: "Whitney SSm A", "Whitney SSm B", "Open Sans", 'Tahoma', 'Helvetica Neue', Helvetica, Arial, sans-serif;
      }
      #outlook a {
        padding: 0;
      }
      img {
        -ms-interpolation-mode: bicubic;
      }
      table {
        mso-table-lspace: 0pt;
        mso-table-rspace: 0pt;
      }
      p,
      a,
      li,
      td,
      blockquote {
        mso-line-height-rule: exactly;
      }
      a[href^='tel'],
      a[href^='sms'] {
        color: inherit;
        cursor: default;
        text-decoration: none;
      }
      p,
      a,
      li,
      td,
      body,
      table,
      blockquote {
        -ms-text-size-adjust: 100%;
        -webkit-text-size-adjust: 100%;
      }
      a[x-apple-data-detectors] {
        color: inherit !important;
        text-decoration: none !important;
        font-size: inherit !important;
        font-family: inherit !important;
        font-weight: inherit !important;
        line-height: inherit !important;
      }
      #bodyCell {
        padding: 10px;
      }
      .templateContainer {
        max-width: 600px !important;
      }
      a.templateButton {
        display: block;
      }
      .templateImage,
      .templateRetinaImage {
        vertical-align: bottom;
      }
      .templateTextContent {
        word-break: break-word;
      }
      .templateTextContent img {
        height: auto !important;
      }
      .templateDividerBlock {
        table-layout: fixed !important;
      }
      body,
      #bodyTable {
        background-color: #f3f3f3;
        background-image: url('https://getpackup.com/static/topo-69c73f24250f9da1fac62f1c56df9694.png');
        background-repeat: repeat;
        background-size: 500px;
      }

      #bodyCell {
        border-top: 0;
      }

      .templateContainer {
        border: 0;
      }

      h1 {
        color: #0b2b44;
        font-family: "Whitney SSm A", "Whitney SSm B", "Open Sans", 'Tahoma', 'Helvetica Neue', Helvetica, Arial, sans-serif;
        font-size: 26px;
        font-style: normal;
        font-weight: bold;
        line-height: 125%;
        letter-spacing: normal;
        text-align: left;
      }
      h2 {
        color: #0b2b44;
        font-family: "Whitney SSm A", "Whitney SSm B", "Open Sans", 'Tahoma', 'Helvetica Neue', Helvetica, Arial, sans-serif;
        font-size: 22px;
        font-style: normal;
        font-weight: bold;
        line-height: 125%;
        letter-spacing: normal;
        text-align: left;
      }
      h3 {
        color: #0b2b44;
        font-family: "Whitney SSm A", "Whitney SSm B", "Open Sans", 'Tahoma', 'Helvetica Neue', Helvetica, Arial, sans-serif;
        font-size: 20px;
        font-style: normal;
        font-weight: bold;
        line-height: 125%;
        letter-spacing: normal;
        text-align: left;
      }
      h4 {
        color: #0b2b44;
        font-family: "Whitney SSm A", "Whitney SSm B", "Open Sans", 'Tahoma', 'Helvetica Neue', Helvetica, Arial, sans-serif;
        font-size: 18px;
        font-style: normal;
        font-weight: bold;
        line-height: 125%;
        letter-spacing: normal;
        text-align: left;
      }
      #templatePreheader {
        background-repeat: no-repeat;
        background-position: center;
        background-size: cover;
        border-top: 0;
        border-bottom: 0;
        padding-top: 9px;
        padding-bottom: 9px;
      }
      #templatePreheader .templateTextContent,
      #templatePreheader .templateTextContent p {
        color: #4a555a;
        font-family: "Whitney SSm A", "Whitney SSm B", "Open Sans", 'Tahoma', 'Helvetica Neue', Helvetica, Arial, sans-serif;
        font-size: 12px;
        line-height: 150%;
        text-align: left;
      }
      #templateHeader {
        background-color: #0b2b44;
        background-repeat: no-repeat;
        background-position: center;
        background-size: cover;
        border-top: 0;
        border-bottom: 0;
        padding-top: 0px;
        padding-bottom: 0px;
      }
      #templateBody {
        background-color: #ffffff;
        background-repeat: no-repeat;
        background-position: center;
        background-size: cover;
        border-top: 0;
        border-bottom: 2px solid #eaeaea;
        padding-top: 32px;
        padding-bottom: 32px;
      }
      #templateBody .templateTextContent,
      #templateBody .templateTextContent p {
        color: #4a555a;
        font-family: "Whitney SSm A", "Whitney SSm B", "Open Sans", 'Tahoma', 'Helvetica Neue', Helvetica, Arial, sans-serif;
        font-size: 16px;
        line-height: 150%;
        text-align: left;
      }
      #templateBody .templateTextContent a,
      #templateBody .templateTextContent p a {
        color: #f36f20;
        font-weight: normal;
        text-decoration: underline;
      }
      #templateFooter {
        background-color: #eeeeee;
        background-repeat: no-repeat;
        background-position: center;
        background-size: cover;
        border-top: 0;
        border-right: 0;
        border-left: 0;
        border-bottom: 0;
        padding-top: 9px;
        padding-bottom: 9px;
      }
      #templateFooter .templateTextContent,
      #templateFooter .templateTextContent p {
        color: #0b2b44;
        font-family: "Whitney SSm A", "Whitney SSm B", "Open Sans", 'Tahoma', 'Helvetica Neue', Helvetica, Arial, sans-serif;
        font-size: 12px;
        line-height: 150%;
        text-align: center;
      }
      @media only screen and (min-width: 768px) {
        .templateContainer {
          width: 600px !important;
        }
      }
      @media only screen and (max-width: 480px) {
        body,
        table,
        td,
        p,
        a,
        li,
        blockquote {
          -webkit-text-size-adjust: none !important;
        }
      }
      @media only screen and (max-width: 480px) {
        body {
          width: 100% !important;
          min-width: 100% !important;
        }
      }
      @media only screen and (max-width: 480px) {
        .templateRetinaImage {
          max-width: 100% !important;
        }
      }
      @media only screen and (max-width: 480px) {
        .templateImage {
          width: 100% !important;
        }
      }
      @media only screen and (max-width: 480px) {
        .templateTextContentContainer {
          max-width: 100% !important;
          width: 100% !important;
        }
      }
      @media only screen and (max-width: 480px) {
        .templateTextContent {
          padding-right: 18px !important;
          padding-left: 18px !important;
        }
      }
      @media only screen and (max-width: 480px) {
        h1 {
          font-size: 22px !important;
          line-height: 125% !important;
        }
      }
      @media only screen and (max-width: 480px) {
        h2 {
          font-size: 20px !important;
          line-height: 125% !important;
        }
      }
      @media only screen and (max-width: 480px) {
        h3 {
          font-size: 18px !important;
          line-height: 125% !important;
        }
      }
      @media only screen and (max-width: 480px) {
        h4 {
          font-size: 16px !important;
          line-height: 150% !important;
        }
      }
      @media only screen and (max-width: 480px) {
        #templatePreheader {
          display: block !important;
        }
      }
      @media only screen and (max-width: 480px) {
        #templatePreheader .templateTextContent,
        #templatePreheader .templateTextContent p {
          font-size: 14px !important;
          line-height: 150% !important;
        }
      }
      @media only screen and (max-width: 480px) {
        #templateHeader .templateTextContent,
        #templateHeader .templateTextContent p {
          font-size: 16px !important;
          line-height: 150% !important;
        }
      }
      @media only screen and (max-width: 480px) {
        #templateBody .templateTextContent,
        #templateBody .templateTextContent p {
          font-size: 16px !important;
          line-height: 150% !important;
        }
      }
      @media only screen and (max-width: 480px) {
        #templateFooter .templateTextContent,
        #templateFooter .templateTextContent p {
          font-size: 14px !important;
          line-height: 150% !important;
        }
      }
    </style>
  </head>
  <body>
    <center>
      <table
        align="center"
        border="0"
        cellpadding="0"
        cellspacing="0"
        height="100%"
        width="100%"
        id="bodyTable"
      >
        <tr>
          <td align="center" valign="top" id="bodyCell">
            <!--[if (gte mso 9)|(IE)]>
						<table align="center" border="0" cellspacing="0" cellpadding="0" width="600" style="width:600px;">
						<tr>
						<td align="center" valign="top" width="600" style="width:600px;">
						<![endif]-->
            <table
              border="0"
              cellpadding="0"
              cellspacing="0"
              width="100%"
              class="templateContainer"
            >
              <tr>
                <td valign="top" id="templatePreheader">
                  <table
                    border="0"
                    cellpadding="0"
                    cellspacing="0"
                    width="100%"
                    class="templateTextBlock"
                    style="min-width: 100%"
                  >
                    <tbody class="templateTextBlockOuter">
                      <tr>
                        <td valign="top" class="templateTextBlockInner" style="padding-top: 9px">
                          <!--[if mso]>
													<table align="left" border="0" cellspacing="0" cellpadding="0" width="100%" style="width:100%;">
													<tr>
													<![endif]-->

                          <!--[if mso]>
													<td valign="top" width="600" style="width:600px;">
													<![endif]-->
                          <table
                            align="left"
                            border="0"
                            cellpadding="0"
                            cellspacing="0"
                            style="max-width: 100%; min-width: 100%"
                            width="100%"
                            class="templateTextContentContainer"
                          >
                            <tbody>
                              <tr>
                                <td
                                  valign="top"
                                  class="templateTextContent"
                                  style="padding: 0px 18px 9px; text-align: center"
                                >
                                  &nbsp;
                                </td>
                              </tr>
                            </tbody>
                          </table>
                          <!--[if mso]>
													</td>
													<![endif]-->

                          <!--[if mso]>
														</tr>
														</table>
														<![endif]-->
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
              <tr>
                <td valign="top" id="templateHeader">
                  <table
                    border="0"
                    cellpadding="0"
                    cellspacing="0"
                    width="100%"
                    class="templateImageBlock"
                    style="min-width: 100%"
                  >
                    <tbody class="templateImageBlockOuter">
                      <tr>
                        <td valign="top" style="padding: 9px" class="templateImageBlockInner">
                          <table
                            align="left"
                            width="100%"
                            border="0"
                            cellpadding="0"
                            cellspacing="0"
                            class="templateImageContentContainer"
                            style="min-width: 100%"
                          >
                            <tbody>
                              <tr>
                                <td
                                  class="templateImageContent"
                                  valign="top"
                                  style="
                                    padding-right: 9px;
                                    padding-left: 9px;
                                    padding-top: 0;
                                    padding-bottom: 0;
                                    text-align: center;
                                  "
                                >
                                  <img
                                    align="center"
                                    alt=""
                                    src="https://res.cloudinary.com/getpackup/image/upload/v1638567266/getpackup/logo-inline-white-transparent_zfbyxc.png"
                                    width="150"
                                    height="50"
                                    style="
                                      max-width: 200px;
                                      padding-bottom: 0;
                                      display: inline !important;
                                      vertical-align: bottom;
                                    "
                                    class="templateImage"
                                  />
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
              <tr>
                <td valign="top" id="templateBody">
                  <table
                    border="0"
                    cellpadding="0"
                    cellspacing="0"
                    width="100%"
                    class="templateTextBlock"
                    style="min-width: 100%"
                  >
                    <tbody class="templateTextBlockOuter">
                      <tr>
                        <td valign="top" class="templateTextBlockInner" style="padding-top: 9px">
                          <!--[if mso]>
													<table align="left" border="0" cellspacing="0" cellpadding="0" width="100%" style="width:100%;">
													<tr>
													<![endif]-->

                          <!--[if mso]>
														<td valign="top" width="600" style="width:600px;">
														<![endif]-->
                          <table
                            align="left"
                            border="0"
                            cellpadding="0"
                            cellspacing="0"
                            style="max-width: 100%; min-width: 100%"
                            width="100%"
                            class="templateTextContentContainer"
                          >
                            <tbody>
                              <tr>
                                <td
                                  valign="top"
                                  class="templateTextContent"
                                  style="
                                    padding-top: 0;
                                    padding-right: 18px;
                                    padding-bottom: 0;
                                    padding-left: 18px;
                                  "
                                >
                                  <h1>Time to start packing 🎒</h1>
                                  <br />
                                  <p>Hey${greetingName !== '' ? `, ${greetingName}` : ' there'}!</p>
                                  <p><strong>${username}</strong>  has created a trip on Packup and is inviting you to join in on the fun.</p>
                                  <p>
                                    Check out the invitation to view trip details including start
                                    date, location, who is coming, and most importantly, who's
                                    bringing the snacks!
                                  </p>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                          <!--[if mso]>
													</td>
													<![endif]-->

                          <!--[if mso]>
													</tr>
													</table>
													<![endif]-->
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <table
                    border="0"
                    cellpadding="0"
                    cellspacing="0"
                    width="100%"
                    class="templateButtonBlock"
                    style="min-width: 100%"
                  >
                    <tbody class="templateButtonBlockOuter">
                      <tr>
                        <td
                          style="
                            padding-top: 18px;
                            padding-right: 18px;
                            padding-bottom: 18px;
                            padding-left: 18px;
                          "
                          valign="top"
                          align="left"
                          class="templateButtonBlockInner"
                        >
                          <table
                            border="0"
                            cellpadding="0"
                            cellspacing="0"
                            class="templateButtonContentContainer"
                            style="
                              border-collapse: separate !important;
                              border-radius: 4px;
                              background-color: #b35900;
                            "
                          >
                            <tbody>
                              <tr>
                                <td
                                  align="left"
                                  valign="middle"
                                  class="templateButtonContent"
                                  style="
                                    font-family: 'Tahoma', 'Helvetica Neue', Helvetica, Arial,
                                      sans-serif;
                                    font-size: 16px;
                                  "
                                >
                                  <a
                                    class="templateButton"
                                    title="button CTA"
                                    href="${tripUrl}"
                                    target="_blank"
                                    style="
                                      font-weight: bold;
                                      letter-spacing: normal;
                                      line-height: 100%;
                                      text-align: center;
                                      text-decoration: none;
                                      color: #ffffff;
                                      padding-top: 18px;
                                      padding-right: 36px;
                                      padding-bottom: 18px;
                                      padding-left: 36px;
                                    "
                                    >View Trip Invitation</a
                                  >
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <table
                    border="0"
                    cellpadding="0"
                    cellspacing="0"
                    width="100%"
                    class="templateDividerBlock"
                    style="min-width: 100%"
                  >
                    <tbody class="templateDividerBlockOuter">
                      <tr>
                        <td
                          class="templateDividerBlockInner"
                          style="min-width: 100%; padding: 18px"
                        >
                          <table
                            class="templateDividerContent"
                            border="0"
                            cellpadding="0"
                            cellspacing="0"
                            width="100%"
                            style="
                              min-width: 100%;
                              border-top-width: 2px;
                              border-top-style: solid;
                              border-top-color: #eaeaea;
                            "
                          >
                            <tbody>
                              <tr>
                                <td>
                                  <span></span>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <table
                    border="0"
                    cellpadding="0"
                    cellspacing="0"
                    width="100%"
                    class="templateTextBlock"
                    style="min-width: 100%"
                  >
                    <tbody class="templateTextBlockOuter">
                      <tr>
                        <td valign="top" class="templateTextBlockInner" style="padding-top: 9px">
                          <!--[if mso]>
													<table align="left" border="0" cellspacing="0" cellpadding="0" width="100%" style="width:100%;">
													<tr>
													<![endif]-->

                          <!--[if mso]>
														<td valign="top" width="600" style="width:600px;">
														<![endif]-->
                          <table
                            align="left"
                            border="0"
                            cellpadding="0"
                            cellspacing="0"
                            style="max-width: 100%; min-width: 100%"
                            width="100%"
                            class="templateTextContentContainer"
                          >
                            <tbody>
                              <tr>
                                <td
                                  valign="top"
                                  class="templateTextContent"
                                  style="
                                    padding-top: 0;
                                    padding-right: 18px;
                                    padding-bottom: 0;
                                    padding-left: 18px;
                                  "
                                >
                                  <p>
                                    <small style="font-size: 12px; color: #888888"
                                      >This email was sent from a notification-only email address
                                      that cannot accept incoming email. Please do not reply to this
                                      message.</small
                                    >
                                  </p>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                          <!--[if mso]>
													</td>
													<![endif]-->

                          <!--[if mso]>
													</tr>
													</table>
													<![endif]-->
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
              <tr>
                <td valign="top" id="templateFooter">
                  <table
                    border="0"
                    cellpadding="0"
                    cellspacing="0"
                    width="100%"
                    class="templateFollowBlock"
                    style="min-width: 100%"
                  >
                    <tbody class="templateFollowBlockOuter">
                      <tr>
                        <td
                          align="center"
                          valign="top"
                          style="padding: 9px"
                          class="templateFollowBlockInner"
                        >
                          <table
                            border="0"
                            cellpadding="0"
                            cellspacing="0"
                            width="100%"
                            class="templateFollowContentContainer"
                            style="min-width: 100%"
                          >
                            <tbody>
                              <tr>
                                <td align="center" style="padding-left: 9px; padding-right: 9px">
                                  <table
                                    border="0"
                                    cellpadding="0"
                                    cellspacing="0"
                                    width="100%"
                                    style="min-width: 100%"
                                    class="templateFollowContent"
                                  >
                                    <tbody>
                                      <tr>
                                        <td
                                          align="center"
                                          valign="top"
                                          style="
                                            padding-top: 9px;
                                            padding-right: 9px;
                                            padding-left: 9px;
                                          "
                                        >
                                          <table
                                            align="center"
                                            border="0"
                                            cellpadding="0"
                                            cellspacing="0"
                                          >
                                            <tbody>
                                              <tr>
                                                <td align="center" valign="top">
                                                  <!--[if mso]>
																									<table align="center" border="0" cellspacing="0" cellpadding="0">
																									<tr>
																									<![endif]-->

                                                  <!--[if mso]>
																									<td align="center" valign="top">
																									<![endif]-->

                                                  <table
                                                    align="left"
                                                    border="0"
                                                    cellpadding="0"
                                                    cellspacing="0"
                                                    style="display: inline"
                                                  >
                                                    <tbody>
                                                      <tr>
                                                        <td
                                                          valign="top"
                                                          style="
                                                            padding-right: 10px;
                                                            padding-bottom: 9px;
                                                          "
                                                          class="templateFollowContentItemContainer"
                                                        >
                                                          <table
                                                            border="0"
                                                            cellpadding="0"
                                                            cellspacing="0"
                                                            width="100%"
                                                            class="templateFollowContentItem"
                                                          >
                                                            <tbody>
                                                              <tr>
                                                                <td
                                                                  align="left"
                                                                  valign="middle"
                                                                  style="
                                                                    padding-top: 5px;
                                                                    padding-right: 10px;
                                                                    padding-bottom: 5px;
                                                                    padding-left: 9px;
                                                                  "
                                                                >
                                                                  <table
                                                                    align="left"
                                                                    border="0"
                                                                    cellpadding="0"
                                                                    cellspacing="0"
                                                                    width=""
                                                                  >
                                                                    <tbody>
                                                                      <tr>
                                                                      <td
                                                                          align="center"
                                                                          valign="middle"
                                                                          width="48"
                                                                          class="templateFollowIconContent"
                                                                        >
                                                                          <a
                                                                            href="https://getpackup.com/"
                                                                            target="_blank"
                                                                            ><img
                                                                              src="https://cdn-images.mailchimp.com/icons/social-block-v2/color-link-48.png"
                                                                              alt="Link"
                                                                              style="display: block"
                                                                              height="24"
                                                                              width="24"
                                                                              class=""
                                                                          /></a>
                                                                        </td>
                                                                        <td
                                                                          align="center"
                                                                          valign="middle"
                                                                          width="48"
                                                                          class="templateFollowIconContent"
                                                                        >
                                                                          <a
                                                                            href="https://www.instagram.com/getpackup/"
                                                                            target="_blank"
                                                                            ><img
                                                                              src="https://cdn-images.mailchimp.com/icons/social-block-v2/color-instagram-48.png"
                                                                              alt="Link"
                                                                              style="display: block"
                                                                              height="24"
                                                                              width="24"
                                                                              class=""
                                                                          /></a>
                                                                        </td>
                                                                        <td
                                                                          align="center"
                                                                          valign="middle"
                                                                          width="48"
                                                                          class="templateFollowIconContent"
                                                                        >
                                                                          <a
                                                                            href="https://www.facebook.com/getpackup/"
                                                                            target="_blank"
                                                                            ><img
                                                                              src="https://cdn-images.mailchimp.com/icons/social-block-v2/color-facebook-48.png"
                                                                              alt="Link"
                                                                              style="display: block"
                                                                              height="24"
                                                                              width="24"
                                                                              class=""
                                                                          /></a>
                                                                        </td>
                                                                        <td
                                                                          align="center"
                                                                          valign="middle"
                                                                          width="48"
                                                                          class="templateFollowIconContent"
                                                                        >
                                                                          <a
                                                                            href="https://www.twitter.com/getpackup/"
                                                                            target="_blank"
                                                                            ><img
                                                                              src="https://cdn-images.mailchimp.com/icons/social-block-v2/color-twitter-48.png"
                                                                              alt="Link"
                                                                              style="display: block"
                                                                              height="24"
                                                                              width="24"
                                                                              class=""
                                                                          /></a>
                                                                        </td>
                                                                      </tr>
                                                                    </tbody>
                                                                  </table>
                                                                </td>
                                                              </tr>
                                                            </tbody>
                                                          </table>
                                                        </td>
                                                      </tr>
                                                    </tbody>
                                                  </table>

                                                  <!--[if mso]>
																									</td>
																									<![endif]-->

                                                  <!--[if mso]>
																										</tr>
																										</table>
																										<![endif]-->
                                                </td>
                                              </tr>
                                            </tbody>
                                          </table>
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <table
                    border="0"
                    cellpadding="0"
                    cellspacing="0"
                    width="100%"
                    class="templateTextBlock"
                    style="min-width: 100%"
                  >
                    <tbody class="templateTextBlockOuter">
                      <tr>
                        <td valign="top" class="templateTextBlockInner" style="padding-top: 9px">
                          <!--[if mso]>
													<table align="left" border="0" cellspacing="0" cellpadding="0" width="100%" style="width:100%;">
													<tr>
													<![endif]-->

                          <!--[if mso]>
														<td valign="top" width="600" style="width:600px;">
														<![endif]-->
                          <table
                            align="left"
                            border="0"
                            cellpadding="0"
                            cellspacing="0"
                            style="max-width: 100%; min-width: 100%"
                            width="100%"
                            class="templateTextContentContainer"
                          >
                            <tbody>
                              <tr>
                                <td
                                  valign="top"
                                  class="templateTextContent"
                                  style="
                                    padding-top: 0;
                                    padding-right: 18px;
                                    padding-bottom: 9px;
                                    padding-left: 18px;
                                  "
                                >
                                  Copyright © ${new Date().getFullYear()} Packup Technologies, Ltd.
                                </td>
                              </tr>
                            </tbody>
                          </table>
                          <!--[if mso]>
														</td>
														<![endif]-->

                          <!--[if mso]>
													</tr>
													</table>
													<![endif]-->
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </table>
            <!--[if (gte mso 9)|(IE)]>
						</td>
						</tr>
						</table>
						<![endif]-->
          </td>
        </tr>
      </table>
    </center>
  </body>
</html>

`,
    textOnlyTemplate: `
    Time to start packing!
    ${username} has invited you to join their trip on Packup.
    Check out the invitation to view trip details including start date, location, who is coming, and most importantly who's bringing the snacks.
    

    Click on the following link or copy and paste into your browser:
    
    ${tripUrl}


    Copyright © ${new Date().getFullYear()} - Packup Technologies, Ltd.
    `,
  }
}

export default inviteToTripEmail
