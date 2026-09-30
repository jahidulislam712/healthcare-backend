import {
  IQueryConfig,
  IQueryParams,
  IQueryResult,
  PrismaCountArgs,
  PrismaFindManyArgs,
  PrismaModelDelegate,
  PrismaWhereConditions,
} from "../interfaces/query.interface";

export class QueryBuilder<T, TInclude = Record<string, unknown>> {
  private query: PrismaFindManyArgs;
  private countQuery: PrismaCountArgs;
  private limit = 10;
  private page = 1;
  private sortBy = "createdAt";
  private sortOrder = "desc";
  private selectFields: Record<string, boolean> | undefined;

  constructor(
    private model: PrismaModelDelegate,
    private queryParams: IQueryParams,
    private config: IQueryConfig,
  ) {
    this.query = {
      where: {},
      include: {},
      orderBy: {},
      skip: (this.page - 1) * this.limit,
      take: this.limit,
    };
    this.countQuery = {
      where: {},
    };
  }

  /**
   *
   * @method Search()
   */
  search(): this {
    const { searchTerm } = this.queryParams;
    const { searchableFields } = this.config;

    if (searchTerm && searchableFields && searchableFields.length > 0) {
      const searchConditions: Record<string, unknown>[] = searchableFields.map(
        (field) => {
          const stringFilter = {
            contains: searchTerm,
            mode: "insensitive" as const,
          };

          return {
            [field]: stringFilter,
          };
        },
      );

      const whereConditions = this.query.where as PrismaWhereConditions;
      whereConditions.OR = searchConditions;

      const countWhereConditions = this.countQuery
        .where as PrismaWhereConditions;
      countWhereConditions.OR = searchConditions;
    }

    return this;
  }

  /**
   *
   * @method paginate()
   */
  paginate(): this {
    const page = Number(this.queryParams.page) || 1;
    const limit = Number(this.queryParams.limit) || 10;

    this.page = page;
    this.limit = limit;

    this.query.skip = (this.page - 1) * this.limit;
    this.query.take = this.limit;

    return this;
  }

  /**
   *
   * @method fields()
   * /doctor/?fields=name,email
   * select:{
   *  name: true,
   *  email: true
   * }
   */
  fields(): this {
    const fieldsParam = this.queryParams.fields;

    if (fieldsParam && typeof fieldsParam === "string") {
      const fieldsArr = fieldsParam.split(",").map((field) => field.trim());
      this.selectFields = {};
      fieldsArr.forEach((field) => {
        if (this.selectFields) {
          this.selectFields[field] = true;
        }
      });

      this.query.select = this.selectFields;
      delete this.query.include;
    }

    return this;
  }

  /**
   *
   * @method include()
   */
  include(relation: TInclude): this {
    if (this.selectFields) {
      return this;
    }

    this.query.include = { ...this.query.include, ...relation };

    return this;
  }

  /**
   *
   * @method sort()
   * /doctor?sortBy=createdAt&order=desc
   */
  sort(): this {
    const sortBy = this.queryParams.sortBy || "createdAt";
    const sortOrder = this.queryParams.sortOrder || "desc";

    this.sortBy = sortBy;
    this.sortOrder = sortOrder;

    // ?sortBy=user.name&sortOrder=asc => orderBy: { user: {name: 'asc'} }
    if (sortBy.includes(".")) {
      const parts = sortBy.split(".");

      if (parts.length === 2) {
        const [relation, nestedField] = parts;
        this.query.orderBy = {
          [relation]: {
            [nestedField]: sortOrder,
          },
        };
      } else if (parts.length === 3) {
        const [relation, nestedRelation, nestedField] = parts;
        this.query.orderBy = {
          [relation]: {
            [nestedRelation]: {
              [nestedField]: sortOrder,
            },
          },
        };
      } else {
        this.query.orderBy = {
          [sortBy]: sortOrder,
        };
      }
    } else {
      this.query.orderBy = {
        [sortBy]: sortOrder,
      };
    }
    
    return this;
  }

  /**
   *
   * @method filter()
   */
  // filter(): this{
  //   const { filterableFields } = this.config
  //   const filterParams: Record<string, unknown> = {}

  //   Object.keys(this.queryParams).forEach((key) => {
  //     filterParams[key] = this.queryParams[key]
  //   })

  //   return this
  // }

  /**
   *
   * @method execute()
   */
  async execute(): Promise<IQueryResult<T>> {
    const [total, data] = await Promise.all([
      this.model.count(this.countQuery),
      this.model.findMany(this.query),
    ]);

    console.log(this.query)

    const totalPages = Math.ceil(total / this.limit);

    return {
      data: data as T[],
      meta: {
        page: this.page,
        limit: this.limit,
        total,
        totalPages,
      },
    };
  }
}