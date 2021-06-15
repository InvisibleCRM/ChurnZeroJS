# ChurnZeroJS

This is a wrapper for ChurnZero JS Api https://support.churnzero.net/hc/en-us/articles/360004683552-Integrate-ChurnZero-using-Javascript

# Usage
```typescript
import { Client } from '@revenuegrid/churnzerojs';

const client = await Client.connect({
		url: 'analytics.churnzero.net/churnzero.js', // or eu1analytics.churnzero.net/churnzero.js
		apiKey: '{your key}',
		accountId: '{account id}',
		contactId: '{contact id}'
});

client.trackEvent('some custom event');

```
