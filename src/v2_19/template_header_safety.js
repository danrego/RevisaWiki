    // Identity writers inspect the original title bytes before trimming.
    // Ordinary ASCII padding remains valid. Other controls or invisible
    // separators do not acquire authority through a normalized title.
    function v219OriginalTemplateHeaderAllowed(header) {
        return typeof header==='string'&&!/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u00A0\u1680\u2000-\u200B\u2028\u2029\u202F\u205F\u3000\uFEFF\uE000-\uF8FF]/.test(header);
    }
