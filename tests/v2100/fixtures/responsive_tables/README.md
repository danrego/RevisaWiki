# Responsive table regression

This wholly synthetic fixture follows an observed nine-column layout. It retains the structural shape, header widths and 72em table minimum needed to reproduce the layout behavior. Names, locations, years, airfield identifiers, measurements and citation URLs are invented. No unpublished article text is included.

The regression keeps every synthetic cell, source, numeric sorting attribute, column width and table minimum unchanged. One finite repair adds a containing-block maximum and a zero minimum to an existing sole horizontal-scroll wrapper.

A separate finite rule can add a scroll wrapper around an unwrapped top-level table with the same three-property style contract, a literal minimum of at least 640px or 40em/rem, and no existing HTML layout ancestor. Those limits select candidate shapes only. They are never substituted as a universal table width. The original table style and all table bytes remain unchanged.

Layout checks distinguish page-wide overflow from intentional scrolling inside the table wrapper. Ordinary block, flex and grid containers, narrow viewports and enlarged text are measured separately. A passing wrapper check does not claim that the table itself fits without horizontal scrolling. Combining columns or removing an intentional table minimum is an editorial change and is outside this automatic repair.
