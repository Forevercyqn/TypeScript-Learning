var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var TagType;
(function (TagType) {
    TagType[TagType["Paragraph"] = 0] = "Paragraph";
    TagType[TagType["Header1"] = 1] = "Header1";
    TagType[TagType["Header2"] = 2] = "Header2";
    TagType[TagType["Header3"] = 3] = "Header3";
    TagType[TagType["HorizontalRule"] = 4] = "HorizontalRule";
})(TagType || (TagType = {}));
var TagTypeToHtml = /** @class */ (function () {
    function TagTypeToHtml() {
        this.tagType = new Map();
        //内容过多可以根据映射关系来set 而不是一个一个来
        this.tagType.set(TagType.Header1, 'h1');
        this.tagType.set(TagType.Header2, 'h2');
        this.tagType.set(TagType.Header3, 'h3');
        this.tagType.set(TagType.HorizontalRule, 'hr');
        this.tagType.set(TagType.Paragraph, 'p');
    }
    //开标签
    TagTypeToHtml.prototype.OpeningTag = function (tagType) {
        return this.GetTag(tagType, '<');
    };
    //关标签
    TagTypeToHtml.prototype.ClosingTag = function (tagType) {
        return this.GetTag(tagType, '</');
    };
    //私有方法 组装标签
    TagTypeToHtml.prototype.GetTag = function (tagType, OpeningTagPattern) {
        var tag = this.tagType.get(tagType);
        if (tag !== null) {
            return "" + OpeningTagPattern + tag + ">";
        }
        return OpeningTagPattern + "p>";
    };
    return TagTypeToHtml;
}());
//内容处理
var MarkdownDocument = /** @class */ (function () {
    function MarkdownDocument() {
        this.content = "";
    }
    MarkdownDocument.prototype.Add = function () {
        var _this = this;
        var content = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            content[_i] = arguments[_i];
        }
        content.forEach(function (e) {
            _this.content += e;
        });
    };
    MarkdownDocument.prototype.Get = function () {
        return this.content;
    };
    return MarkdownDocument;
}());
//解析
var ParseElement = /** @class */ (function () {
    function ParseElement() {
        this.CurrentLine = "";
    }
    return ParseElement;
}());
var VisitorBase = /** @class */ (function () {
    function VisitorBase(tagType, tagTypeToHtml) {
        this.tagType = tagType;
        this.tagTypeToHtml = tagTypeToHtml;
    }
    ;
    VisitorBase.prototype.Visit = function (token, markdownDocument) {
        markdownDocument.Add(this.tagTypeToHtml.OpeningTag(this.tagType), token.CurrentLine, this.tagTypeToHtml.ClosingTag(this.tagType));
    };
    return VisitorBase;
}());
//访问者实现
var Header1Visitor = /** @class */ (function (_super) {
    __extends(Header1Visitor, _super);
    function Header1Visitor() {
        return _super.call(this, TagType.Header1, new TagTypeToHtml()) || this;
    }
    return Header1Visitor;
}(VisitorBase));
var Header2Visitor = /** @class */ (function (_super) {
    __extends(Header2Visitor, _super);
    function Header2Visitor() {
        return _super.call(this, TagType.Header2, new TagTypeToHtml()) || this;
    }
    return Header2Visitor;
}(VisitorBase));
var Header3Visitor = /** @class */ (function (_super) {
    __extends(Header3Visitor, _super);
    function Header3Visitor() {
        return _super.call(this, TagType.Header3, new TagTypeToHtml()) || this;
    }
    return Header3Visitor;
}(VisitorBase));
var ParagraphVisitor = /** @class */ (function (_super) {
    __extends(ParagraphVisitor, _super);
    function ParagraphVisitor() {
        return _super.call(this, TagType.Paragraph, new TagTypeToHtml()) || this;
    }
    return ParagraphVisitor;
}(VisitorBase));
var HorizontalRuleVisitor = /** @class */ (function (_super) {
    __extends(HorizontalRuleVisitor, _super);
    function HorizontalRuleVisitor() {
        return _super.call(this, TagType.HorizontalRule, new TagTypeToHtml()) || this;
    }
    return HorizontalRuleVisitor;
}(VisitorBase));
var Visitable = /** @class */ (function () {
    function Visitable() {
    }
    Visitable.prototype.Accept = function (visitor, token, markdownDocument) {
        visitor.Visit(token, markdownDocument);
    };
    return Visitable;
}());
//责任链
var Handler = /** @class */ (function () {
    function Handler() {
        this.next = null;
    }
    Handler.prototype.SetNext = function (next) {
        this.next = next;
    };
    Handler.prototype.HandleRequest = function (request) {
        if (!this.CanHandle(request)) {
            if (this.next !== null) {
                this.next.HandleRequest(request);
            }
            return;
        }
    };
    return Handler;
}());
var ParseChainHandler = /** @class */ (function (_super) {
    __extends(ParseChainHandler, _super);
    function ParseChainHandler(document, tagType, visitor) {
        var _this = _super.call(this) || this;
        _this.document = document;
        _this.tagType = tagType;
        _this.visitor = visitor;
        _this.visitable = new Visitable();
        return _this;
    }
    ParseChainHandler.prototype.CanHandle = function (request) {
        var split = new LineParser().Parse(request.CurrentLine, this.tagType);
        if (split[0]) {
            request.CurrentLine = split[1];
            this.visitable.Accept(this.visitor, request, this.document);
        }
        return split[0];
    };
    return ParseChainHandler;
}(Handler));
var LineParser = /** @class */ (function () {
    function LineParser() {
    }
    LineParser.prototype.Parse = function (value, tag) {
        var output = [false, ''];
        output[1] = value;
        if (value == '') {
            return output;
        }
        var split = value.startsWith("" + tag);
        if (split) {
            output[0] = true;
            output[1] = value.substr(tag.length);
        }
        return output;
    };
    return LineParser;
}());
var ParagraphHandler = /** @class */ (function (_super) {
    __extends(ParagraphHandler, _super);
    function ParagraphHandler(document) {
        var _this = _super.call(this) || this;
        _this.document = document;
        _this.visitable = new Visitable();
        _this.visitor = new ParagraphVisitor();
        return _this;
    }
    ParagraphHandler.prototype.CanHandle = function (request) {
        this.visitable.Accept(this.visitor, request, this.document);
        return true;
    };
    return ParagraphHandler;
}(Handler));
//具体处理程序
var Header1ChainHandler = /** @class */ (function (_super) {
    __extends(Header1ChainHandler, _super);
    function Header1ChainHandler(document) {
        return _super.call(this, document, '#', new Header1Visitor()) || this;
    }
    return Header1ChainHandler;
}(ParseChainHandler));
var Header2ChainHandler = /** @class */ (function (_super) {
    __extends(Header2ChainHandler, _super);
    function Header2ChainHandler(document) {
        return _super.call(this, document, '##', new Header2Visitor()) || this;
    }
    return Header2ChainHandler;
}(ParseChainHandler));
var Header3ChainHandler = /** @class */ (function (_super) {
    __extends(Header3ChainHandler, _super);
    function Header3ChainHandler(document) {
        return _super.call(this, document, '###', new Header3Visitor()) || this;
    }
    return Header3ChainHandler;
}(ParseChainHandler));
var HorizontalRuleHandler = /** @class */ (function (_super) {
    __extends(HorizontalRuleHandler, _super);
    function HorizontalRuleHandler(document) {
        return _super.call(this, document, '---', new HorizontalRuleVisitor()) || this;
    }
    return HorizontalRuleHandler;
}(ParseChainHandler));
//设置处理程序链
var ChainOfResponsibilityFactory = /** @class */ (function () {
    function ChainOfResponsibilityFactory() {
    }
    ChainOfResponsibilityFactory.prototype.Build = function (document) {
        var header1 = new Header1ChainHandler(document);
        var header2 = new Header2ChainHandler(document);
        var header3 = new Header3ChainHandler(document);
        var horizontalRule = new HorizontalRuleHandler(document);
        var paragraph = new ParagraphHandler(document);
        header1.SetNext(header2);
        header2.SetNext(header3);
        header3.SetNext(horizontalRule);
        horizontalRule.SetNext(paragraph);
        return header1;
    };
    return ChainOfResponsibilityFactory;
}());
//获取用户键入的文本
var Markdown = /** @class */ (function () {
    function Markdown() {
    }
    Markdown.prototype.ToHtml = function (text) {
        var document = new MarkdownDocument();
        var header1 = new ChainOfResponsibilityFactory().Build(document);
        var lines = text.split("\n");
        for (var index = 0; index < lines.length; index++) {
            var parseElement = new ParseElement();
            parseElement.CurrentLine = lines[index];
            header1.HandleRequest(parseElement);
        }
        return document.Get();
    };
    return Markdown;
}());
//解决刷新页面丢失内容
var HtmlHandle = /** @class */ (function () {
    function HtmlHandle() {
        this.markdownChange = new Markdown;
    }
    HtmlHandle.prototype.TextChangeHandle = function (id, output) {
        var _this = this;
        var markdown = document.getElementById(id);
        var markdownOutPut = document.getElementById(output);
        if (markdown !== null) {
            markdown.onkeyup = function (e) {
                _this.RenderHtmlContent(markdown, markdownOutPut);
            };
            window.onload = function (e) {
                _this.RenderHtmlContent(markdown, markdownOutPut);
            };
        }
    };
    HtmlHandle.prototype.RenderHtmlContent = function (markdown, markdownOutPut) {
        if (markdown.value) {
            markdownOutPut.innerHTML = this.markdownChange.ToHtml(markdown.value);
        }
        else
            markdownOutPut.innerHTML = "<p></p>";
    };
    return HtmlHandle;
}());
