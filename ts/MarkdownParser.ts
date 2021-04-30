enum TagType {
    Paragraph,
    Header1,
    Header2,
    Header3,
    HorizontalRule
}

class TagTypeToHtml {
    private readonly tagType: Map<TagType, string> = new Map<TagType, string>();
    constructor() {
        //内容过多可以根据映射关系来set 而不是一个一个来
        this.tagType.set(TagType.Header1, 'h1');
        this.tagType.set(TagType.Header2, 'h2');
        this.tagType.set(TagType.Header3, 'h3');
        this.tagType.set(TagType.HorizontalRule, 'hr');
        this.tagType.set(TagType.Paragraph, 'p');
    }

    //开标签
    public OpeningTag(tagType: TagType): string {
        return this.GetTag(tagType, '<');
    }

    //关标签
    public ClosingTag(tagType: TagType): string {
        return this.GetTag(tagType, '</');
    }

    //私有方法 组装标签
    private GetTag(tagType: TagType, OpeningTagPattern: string): string {
        let tag = this.tagType.get(tagType);
        if (tag !== null) {
            return `${OpeningTagPattern}${tag}>`;
        }
        return `${OpeningTagPattern}p>`
    }
}

interface IMarkdownDocument {
    Add(...content: string[]): void;
    Get(): string;
}

//内容处理
class MarkdownDocument implements IMarkdownDocument {
    private content: string = "";
    Add(...content: string[]): void {
        content.forEach(e => {
            this.content += e;
        })
    }

    Get(): string {
        return this.content;
    }
}

//解析
class ParseElement {
    CurrentLine: string = "";
}

//访问者模式
interface IVisitor {
    Visit(token: ParseElement, markdownDocument: IMarkdownDocument): void;
}

interface IVisitable {
    Accept(visitor: IVisitor, token: ParseElement, markdownDocument: IMarkdownDocument): void;
}

abstract class VisitorBase implements IVisitor {
    constructor(private readonly tagType: TagType, private readonly tagTypeToHtml: TagTypeToHtml) { };
    Visit(token: ParseElement, markdownDocument: MarkdownDocument): void {
        markdownDocument.Add(this.tagTypeToHtml.OpeningTag(this.tagType), token.CurrentLine, this.tagTypeToHtml.ClosingTag(this.tagType));
    }
}

//访问者实现
class Header1Visitor extends VisitorBase {
    constructor() {
        super(TagType.Header1, new TagTypeToHtml());
    }
}

class Header2Visitor extends VisitorBase {
    constructor() {
        super(TagType.Header2, new TagTypeToHtml());
    }
}

class Header3Visitor extends VisitorBase {
    constructor() {
        super(TagType.Header3, new TagTypeToHtml());
    }
}

class ParagraphVisitor extends VisitorBase {
    constructor() {
        super(TagType.Paragraph, new TagTypeToHtml());
    }
}

class HorizontalRuleVisitor extends VisitorBase {
    constructor() {
        super(TagType.HorizontalRule, new TagTypeToHtml());
    }
}

class Visitable implements IVisitable {
    Accept(visitor: IVisitor, token: ParseElement, markdownDocument: MarkdownDocument): void {
        visitor.Visit(token, markdownDocument);
    }
}

//责任链
abstract class Handler<T> {
    protected next: Handler<T> | null = null;
    public SetNext(next: Handler<T>): void {
        this.next = next;
    }
    public HandleRequest(request: T): void {
        if (!this.CanHandle(request)) {
            if (this.next !== null) {
                this.next.HandleRequest(request)
            }
            return;
        }
    }
    protected abstract CanHandle(request: T): boolean;
}

class ParseChainHandler extends Handler<ParseElement> {
    private readonly visitable: IVisitable = new Visitable();
    constructor(private readonly document: IMarkdownDocument, private readonly tagType: string, private readonly visitor: IVisitor) {
        super();
    }

    protected CanHandle(request: ParseElement): boolean {
        let split = new LineParser().Parse(request.CurrentLine, this.tagType);
        if (split[0]) {
            request.CurrentLine = split[1];
            this.visitable.Accept(this.visitor, request, this.document);
        }
        return split[0];
    }
}

class LineParser {
    public Parse(value: string, tag: string): [boolean, string] {
        let output: [boolean, string] = [false, ''];
        output[1] = value;

        if (value == '') {
            return output;
        }

        let split = value.startsWith(`${tag}`);
        if (split) {
            output[0] = true;
            output[1] = value.substr(tag.length);
        }
        return output;
    }
}


class ParagraphHandler extends Handler<ParseElement> {
    private readonly visitable: IVisitable = new Visitable();
    private readonly visitor: IVisitor = new ParagraphVisitor();
    protected CanHandle(request: ParseElement): boolean {
        this.visitable.Accept(this.visitor, request, this.document);
        return true;
    }
    constructor(private readonly document: IMarkdownDocument) {
        super();
    }
}

//具体处理程序
class Header1ChainHandler extends ParseChainHandler {
    constructor(document: IMarkdownDocument) {
        super(document, '#', new Header1Visitor());
    }
}

class Header2ChainHandler extends ParseChainHandler {
    constructor(document: IMarkdownDocument) {
        super(document, '##', new Header2Visitor());
    }
}

class Header3ChainHandler extends ParseChainHandler {
    constructor(document: IMarkdownDocument) {
        super(document, '###', new Header3Visitor());
    }
}

class HorizontalRuleHandler extends ParseChainHandler {
    constructor(document: IMarkdownDocument) {
        super(document, '---', new HorizontalRuleVisitor());
    }
}


//设置处理程序链
class ChainOfResponsibilityFactory {
    Build(document: IMarkdownDocument): ParseChainHandler {
        let header1: Header1ChainHandler = new Header1ChainHandler(document);
        let header2: Header2ChainHandler = new Header2ChainHandler(document);
        let header3: Header3ChainHandler = new Header3ChainHandler(document);
        let horizontalRule: HorizontalRuleHandler = new HorizontalRuleHandler(document);
        let paragraph: ParagraphHandler = new ParagraphHandler(document);

        header1.SetNext(header2);
        header2.SetNext(header3);
        header3.SetNext(horizontalRule);
        horizontalRule.SetNext(paragraph);
        return header1;
    }
}

//获取用户键入的文本
class Markdown {
    public ToHtml(text:string) :string {
        let document : IMarkdownDocument = new MarkdownDocument();
        let header1 : Header1ChainHandler = new ChainOfResponsibilityFactory().Build(document);
        let lines :string[] = text.split(`\n`);
        for(let index = 0; index < lines.length; index++) {
            let parseElement : ParseElement = new ParseElement();
            parseElement.CurrentLine = lines[index];
            header1.HandleRequest(parseElement);
        }

        return document.Get();
    }
}

//解决刷新页面丢失内容

class HtmlHandle {
    private markdownChange : Markdown = new Markdown;
    public TextChangeHandle(id: string, output: string) : void {
        let markdown = <HTMLTextAreaElement> document.getElementById(id);
        let markdownOutPut = <HTMLLabelElement> document.getElementById(output);
        if(markdown !== null) {
            markdown.onkeyup = (e) => {
                this.RenderHtmlContent(markdown,markdownOutPut);
            }

            window.onload = (e) => {
                this.RenderHtmlContent(markdown, markdownOutPut);
            }
        }
    }

    private RenderHtmlContent(markdown:HTMLTextAreaElement, markdownOutPut:HTMLLabelElement) {
        if(markdown.value) {
            markdownOutPut.innerHTML = this.markdownChange.ToHtml(markdown.value);
        }
         else 
         markdownOutPut.innerHTML = "<p></p>";
    }
}