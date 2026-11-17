/** Synthetic Internet messages. No mailbox, IMAP account or patient data is used. */
const crlf = (source: string) => source.replace(/\r?\n/g, '\r\n');

export const PLAIN_EMAIL = crlf(`From: Alex Example <alex@example.test>
To: Morgan Example <morgan@example.test>
Subject: Planning the next workshop
Date: Thu, 12 Nov 2026 10:00:00 +0000
Message-ID: <workshop-plain@example.test>

Hi Morgan,

Could you review the workshop outline before Friday?
We can add the final agenda as an attachment to the reply.

Thanks,
Alex
`);

export const RELATED_EMAIL = crlf(`From: Alex Example <alex@example.test>
To: Morgan Example <morgan@example.test>
Cc: Casey Example <casey@example.test>
Subject: Workshop outline with an inline image
Date: Thu, 12 Nov 2026 10:15:00 +0000
Message-ID: <workshop-related@example.test>
MIME-Version: 1.0
Content-Type: multipart/mixed; boundary="workshop-mixed"

--workshop-mixed
Content-Type: multipart/related; boundary="workshop-related"

--workshop-related
Content-Type: multipart/alternative; boundary="workshop-alternative"

--workshop-alternative
Content-Type: text/plain; charset=utf-8
Content-Transfer-Encoding: quoted-printable

Workshop outline

The inline image is a synthetic icon. The attached agenda is plain text.

--workshop-alternative
Content-Type: text/html; charset=utf-8
Content-Transfer-Encoding: quoted-printable

<html><body><h1>Workshop outline</h1><p>This message includes a protected inline image and a separate attachment.</p><img src=3D"cid:workshop-icon@example.test" alt=3D"Synthetic workshop icon" width=3D"48" height=3D"48"><p>Review the attached agenda, then use Reply all to compose a response.</p></body></html>
--workshop-alternative--
--workshop-related
Content-Type: image/png; name="workshop-icon.png"
Content-Transfer-Encoding: base64
Content-Disposition: inline; filename="workshop-icon.png"
Content-ID: <workshop-icon@example.test>

iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAGUlEQVR4nGNIWPpLNfk1JsmAVRRIMgxKHQDoPm5BFMmNkQAAAABJRU5ErkJggg==
--workshop-related--
--workshop-mixed
Content-Type: text/plain; charset=utf-8; name="agenda.txt"
Content-Transfer-Encoding: base64
Content-Disposition: attachment; filename="agenda.txt"

U3ludGhldGljIHdvcmtzaG9wIGFnZW5kYQoKMTAgYW0gLSBXZWxjb21lCjExIGFtIC0gRGVzaWduIHJldmlldwo=
--workshop-mixed--
`);

export const UNICODE_NESTED_EMAIL =
  crlf(`From: =?UTF-8?Q?Jos=C3=A9_Example?= <jose@example.test>
To: Morgan Example <morgan@example.test>
Subject: =?UTF-8?B?UmV2aWV3OiBjYWbDqSBhbmQgZm9sbG93LXVwIOKckw==?=
Date: Thu, 12 Nov 2026 11:00:00 +0000
Message-ID: <workshop-unicode@example.test>
In-Reply-To: <workshop-plain@example.test>
References: <workshop-plain@example.test>
MIME-Version: 1.0
Content-Type: multipart/mixed; boundary="unicode-mixed"

--unicode-mixed
Content-Type: multipart/alternative; boundary="unicode-alternative"

--unicode-alternative
Content-Type: text/plain; charset=utf-8
Content-Transfer-Encoding: quoted-printable

The caf=C3=A9 workshop is confirmed. Thank you! =E2=9C=93

--unicode-alternative
Content-Type: text/html; charset=utf-8
Content-Transfer-Encoding: quoted-printable

<html><body><h2>Workshop confirmed</h2><p>The caf=C3=A9 workshop is confirmed. Thank you! =E2=9C=93</p><p>This is the HTML alternative inside a nested multipart message.</p></body></html>
--unicode-alternative--
--unicode-mixed
Content-Type: text/plain; charset=utf-8
Content-Transfer-Encoding: quoted-printable
Content-Disposition: attachment; filename*=utf-8''r%C3%A9sum%C3%A9.txt

Synthetic r=C3=A9sum=C3=A9 attachment. No personal information.
--unicode-mixed--
`);

export const EXTERNAL_IMAGE_EMAIL =
  crlf(`From: Updates Example <updates@example.test>
To: Morgan Example <morgan@example.test>
Subject: Outside media stays inactive
Date: Thu, 12 Nov 2026 11:30:00 +0000
Message-ID: <workshop-external@example.test>
MIME-Version: 1.0
Content-Type: text/html; charset=utf-8

<html><body><h1>External media policy</h1><p>This HTML-only message refers to an outside image. The preview keeps it unfetched.</p><img src="https://images.example.test/tracking-pixel.png" alt="Outside image blocked"><p><a href="https://example.test/workshop">Outside links also stay inactive.</a></p></body></html>
`);

export const MDY_DOCUMENT = `---
title: Synthetic workshop notes
document_id: workshop-notes-example
owner: Documentation team
tags:
  - planning
  - synthetic-demo
---
# Workshop notes

This is **MDY**, the preferred format for systems that do not need MIME email.
The front matter stays with the document while the rich text body is edited.

## Agenda

- Review the shared document.
- Add a small synthetic attachment.
- Save, then reopen to check protected persistence.

## Decisions

| Topic | Decision |
| --- | --- |
| Mail messages | MIME |
| Ordinary documents | MDY |

No real patient or personal information belongs in this demo.
`;
