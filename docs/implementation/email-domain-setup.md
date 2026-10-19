# Sign-in email domain setup

October 19, 2026. The user selected `77cube.dev` and confirmed Porkbun manages its DNS. Use a dedicated sending subdomain, `auth.77cube.dev`, for app sign-in codes, with planned sender `AIPoweredID <signin@auth.77cube.dev>`. Normal mail stays with Zoho; the app does not need a new Zoho inbox at that sending address.

## Existing DNS inspected without changes

The Porkbun DNS screen showed eleven existing records and Porkbun authoritative nameservers. Existing email records include:

- Root MX: `mx.zoho.com` priority 10, `mx2.zoho.com` priority 20, and `mx3.zoho.com` priority 50.
- Root SPF TXT: `v=spf1 include:zohomail.com ~all`.
- Zoho DKIM TXT at `zmail._domainkey.77cube.dev`.

Preserve those records and all other existing website/verification records. No `auth` sending records appeared in the inspected list. Do not replace root MX, edit root SPF, change nameservers, enable Resend incoming mail, or use bulk DNS templates for this setup.

## Generated Resend records — pending DNS entry

The user directed use of the other Chrome window, already signed in to Resend. In that session, `auth.77cube.dev` was added in North Virginia (`us-east-1`), using the default `send` Return-Path. [Resend's setup page](https://resend.com/domains/add/44998004-8846-4f6d-8bc0-d1e237d7cfa7) generated the following three required records. Sending is enabled in the domain setup; receiving remains off. Domain verification has not completed, and no Porkbun DNS changes have been made by this work.

| Type | Porkbun Host | Answer / Value | TTL |
| --- | --- | --- | --- |
| TXT | `resend._domainkey.auth` | Public DKIM value below | 600 |
| CNAME | `rsend.auth` | `rsend.forge.rmta.net` | 600 |
| CNAME | `send.auth` | `send.forge.rmta.net` | 600 |

Public DKIM value (a public DNS record, not an API credential):

```text
p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCd2P/Wxm1cCA96m1py++wwOZgZq66VtDsyVchVX8KrPQyXXmsXSVdGEX+4/K4SRKnVaymBJiVxvsnx4hnCyUwfn/kELpE3vSIHZlfZQFRaTAvECBLDKr7m8qQKKcwx1/dZ01bgH2ghLiWVUuy5ZpkI/N17Ww3yYlhrCLjq0ucPpwIDAQAB
```

Resend displays TTL Auto; use Porkbun's existing 600-second default. Porkbun appends `.77cube.dev` to the Host field, so enter only the relative Host listed above. These are the CNAME records actually generated for this domain, not generic example SPF/MX settings. No priority applies to these three records. The optional DMARC row is not part of this change; do not alter root-domain mail policy while setting up this subdomain.

After the records are added, use Resend's verification control and confirm the resulting status. Recheck the original Zoho/website records. Store the Resend sending key privately; never place it in these notes or chat.

References: [Resend domain setup](https://resend.com/docs/add-a-domain), [Porkbun DNS editing](https://kb.porkbun.com/article/68-how-to-edit-dns-records).
