val RegisterAdAsEdges = new UDF {

    import scala.util.{Failure, Try}

    var labelName: String = _
    var multiLabelName: String = _
    var registerAll: Boolean = true
    var operation: String = _
    var differentFormat: Boolean = false
    var skipGraphOperation: Boolean = false
    var numOfShard: Int = 100
    var singleFilterKeys = Set.empty[String]
    var metaServiceName: String = _
    var metaLabelName: String = _
    var defaultEnableTargetKey: Boolean = true
    var defaultEnableDownloadListOpt: Option[Boolean] = None

    val DefaultTargetsPrefix = "default_targets"

    def parseInput(jsValue: JsValue) = {
      jsValue match {
        case JsString(s) =>
           dirty, dirty.
          val trimed = s.toString.trim()
          if (trimed.startsWith("[")) {
            Json.parse(trimed)
          } else if (trimed.startsWith("{")) {
            Json.parse(trimed)
          } else {
            Json.parse(s)
          }
        case _: JsValue => jsValue
      }
    }

    object TesseraParser {

      import scala.collection.mutable

      val singleKeys = Map("gender" -> "gender",
        "age" -> "ad_age_band",
        "os" -> "device",
        "location" -> "living_region_id1")

      val multiOrKeys = Map("tag_label" -> "taglabel", "shopping_category" -> "shopping_category")
      val multiAndKeys = Map("interests" -> "ad_interests", "keyword" -> "keyword", "action" -> "action")

      val metaKeys = Set.empty[String]
            Set("ad_material_id", "ad_group_id", "ad_campaign_id", "advertiser_id",
              "ad_template_id", "ad_name", "bid_cpm", "bid_cpi", "bid_type", "adult_yn", "site_url", "ad_categories", "images",
              "campaign_daily_cap", "campaign_daily_amt", "ad_daily_cap", "ad_daily_amt", "is_inside"
            )

      val propKeysAll = Map.empty[String, String]
              Map(
              "score" -> "score", "ad_campaign_id" -> "campaign_id", "advertiser_id" -> "owner_id",
              "ad_name" -> "name", "bid_cpc" -> "bid_amount", "ad_daily_amt" -> "daily_budget")

      def parseInt(i: Int): Seq[String] = {
        val buffer = mutable.ArrayBuffer.empty[String]
        var bit = 0
        var mask = (1 << bit)
        while (mask <= i) {
          if ((mask & i) != 0)
            buffer += mask.toString

          bit += 1
          mask = (1 << bit)
        }
        buffer
      }

      def valueParse(s: String): Seq[String] = {
        val tokens = s.split(",")
        if (tokens.length > 1) {
          tokens.toSeq
        } else {
          Try {
            s.toInt
          } match {
            case Failure(ex) => Seq(s)
            case _ => parseInt(s.toInt)
          }
        }
      }

      def parse(jsObject: JsObject, singleFilterKeys: Set[String]): Target = {
        val targets = (jsObject \ "target").asOpt[JsObject].getOrElse(Json.obj())
        val id = (jsObject \ "ad_group_id").as[Long].toString
        val props = mutable.ArrayBuffer.empty[(String, JsValue)]
        val andFields = mutable.ArrayBuffer.empty[TargetFilter]
        val orFields = mutable.ArrayBuffer.empty[TargetFilter]
        val metas = mutable.ArrayBuffer.empty[(String, JsValue)]

        (jsObject.fieldSet ++ targets.fieldSet).filter(t => t._2 != JsNull).foreach { case (k, v) =>
          val values = valueParse(JSONParser.jsValueToString(v)).toSet
          val newValues = k match {
            case "age" =>
              values.map { value =>
                value.toInt match {
                  case 2 => 15
                  case 4 => 20
                  case 8 => 26
                  case 16 => 31
                  case 32 => 41
                  case 64 => 51
                  case _ => 0
                }
              }.map(_.toString)
            case "gender" =>
              values.map { value =>
                value.toInt match {
                  case 1 => "M"
                  case 2 => "F"
                  case _ => "N"
                }
              }
            case "os" =>
              values.map { value =>
                value.toInt match {
                  case 1 => "Android"
                  case 2 => "iOS"
                  case 4 => "PC"
                  case 1024 => "n/a"
                }
              }
            case "location" =>
              values.map { value =>
                value.toInt match {
                  case 2 => "I"  seoul
                  case 4 => "K"  incheon
                  case 8 => "B"  Gyeonggi
                  case 16 => "A"  gangwon
                  case 32 => "G"  daejeon
                  case 64 => "P"  chungbuk
                  case 128 => "O"  chungnam
                  case 256 => "E"  gwangju
                  case 512 => "M"  jeonbuk
                  case 1024 => "L"  jeonnam
                  case 2048 => "F"  daegu
                  case 4096 => "J"  ulsan
                  case 8192 => "D"  gyeongbuk
                  case 16384 => "C"  gyeongnam
                  case 32768 => "H"  busan
                  case 65536 => "N"  jeju
                  case 1 => "Z"  overseas
                  case _ => "n/a"
                }
              }
            case _ => values
          }

          singleKeys.get(k).foreach(as => andFields += InFilter(as, newValues))
          propKeysAll.get(k).foreach(as => props += propKeysAll(k) -> v)
          multiOrKeys.get(k).foreach(as => orFields += InFilter(as, newValues))
          multiAndKeys.get(k).foreach(as => andFields += InFilter(as, newValues))

          if (metaKeys.contains(k)) {
            metas += k -> v
          }
        }

        val metaJsObj = Json.toJson(metas.toMap)

        props += ("meta" -> JsString(metaJsObj.toString()))
        props += ("start_at" -> JsNumber(System.currentTimeMillis()))
        props += ("end_at" -> JsNumber(1522335600000L))

        if (orFields.nonEmpty) {
          andFields += OrFilter(orFields)
        }
        val filter = AndFilter(andFields)
        Target(id, filter, JsObject(props), singleFilterKeys)
      }

    }

    private def toServiceTargeting(input: JsObject): Seq[JsValue] = {
      val now = System.currentTimeMillis()
      (input \ "id").asOpt[String].toSeq.map { to =>
        val from = (input \ "serviceName").asOpt[String].getOrElse(metaServiceName)
        val innerProps = (input \ "props").asOpt[JsObject].getOrElse(Json.obj())
        val mergedProps = input ++ innerProps ++ Json.obj("created_at" -> now)
        val metaProps = if (!mergedProps.keys("enable_download_id_list") && defaultEnableDownloadListOpt.isDefined) {
          mergedProps ++ Json.obj("enable_download_id_list" -> defaultEnableDownloadListOpt.get)
        } else {
          mergedProps
        }

        Json.obj(
          "timestamp" -> now,
          "from" -> from,
          "to" -> to,
          "label" -> metaLabelName,
          "props" -> metaProps,
          "created_at" -> now
        )
      }
    }


    private def explode(ctx: GraphContext, ad: Target): Seq[JsValue] = {
      val now = System.currentTimeMillis()
      TODO: optimize data size on filter.

      def toJson(arg: (String, String, TargetFilter)): JsObject = {
        val (from, keyType, filter) = arg
        val lName = if (keyType == "single") labelName else multiLabelName
        val props = Map(
          "filter" -> JsString(TargetFilter.toJson(filter).toString),
          "has_multi_filters" -> JsBoolean(ad.hasMultiValueFilters)
        )
        val propsJson = Json.toJson(props).as[JsObject] ++ ad.props

        Json.obj(
          "timestamp" -> now,
          "from" -> from,
          "to" -> ad.id,
          "label" -> lName,
          "props" -> propsJson
        )
      }

      val zeroFilterDimensions = Set("day_of_week", "hour_of_day", "placement")

      val specificEdges = Target.convertAdToEdges(ad).map { case (from, isMulti, targetFilter) =>
        val kvs = from.split(",").filter { t =>
          val arr = t.split('.')
          !zeroFilterDimensions(arr.head)
        }
        (kvs.mkString(","), isMulti, targetFilter)
      }.distinct.map { case (from, isMulti, targetFilter) =>
         specificEdges 에 from 이 empty string 인 경우에 default_targeting에 sharding 하여 저장함.
        if (from.isEmpty) {
          import scala.util.hashing.MurmurHash3
          val hashKey = ad.id + targetFilter.toString
          val h = MurmurHash3.stringHash(hashKey)
          val hash = if (h < 0) -1 * h else h
          val shardNum = hash % numOfShard

          val newFrom = s"${DefaultTargetsPrefix}_${shardNum}"
          toJson(newFrom, isMulti, targetFilter)

        } else {
          toJson(from, isMulti, targetFilter)
        }
      } ++ Seq(toJson(ad.id, "single", ad.filter))

      val allEdge =
        if (!registerAll || !ad.hasMultiValueFilters) Nil
        else Seq(toJson(UDFLocalCache.allWithShard(ad.id, numOfShard), "single", ad.filter))

      val ret = allEdge ++ specificEdges

      ret.foreach { js => logger.debug(s"[RegisterAd]: ${Json.prettyPrint(js)}") }
      ret
    }

    override def init(options: String, functionName: String): UDF = {
      val js = Json.parse(options)
      metaServiceName = (js \ "metaServiceName").asOpt[String].getOrElse("s2graph")
      metaLabelName = (js \ "metaLabelName").asOpt[String].getOrElse("service_targeting")

      labelName = (js \ "labelName").as[String]
      multiLabelName = (js \ "multiLabelName").asOpt[String].getOrElse(labelName)
      registerAll = (js \ "registerAll").asOpt[Boolean].getOrElse(true)
      operation = (js \ "operation").asOpt[String].getOrElse("insert")
      differentFormat = (js \ "differentFormat").asOpt[Boolean].getOrElse(false)
      skipGraphOperation = (js \ "skipGraphOperation").asOpt[Boolean].getOrElse(false)
      numOfShard = (js \ "numOfShard").asOpt[Int].getOrElse(100)
      singleFilterKeys = (js \ "singleFilterKeys").asOpt[Set[String]].getOrElse(TargetFilter.SingleValueDimension)
      defaultEnableTargetKey = (js \ "defaultEnableTargetKey").asOpt[Boolean].getOrElse(true)
      defaultEnableDownloadListOpt = (js \ "defaultEnableDownloadList").asOpt[Boolean]
      this
    }

    override def apply(_input: JsValue, ctx: GraphContext)(implicit ec: ExecutionContext): Future[JsValue] = {
      val inputs = parseInput(_input).as[Seq[JsObject]]
      val graph = ctx.getGraph

      val edges = inputs.flatMap { input =>
        val meta = toServiceTargeting(input)
        val enableTargetKey = (input \ "enable_target_key").asOpt[Boolean].getOrElse(defaultEnableTargetKey)

        val extras =
          if (enableTargetKey) {
            val ad =
              if (differentFormat) TesseraParser.parse(input, singleFilterKeys)
              else Target.parse(input, singleFilterKeys)

            explode(ctx, ad)
          } else {
            Nil
          }

        meta ++ extras

      }


      val adEdges = edges.flatMap { js => graph.requestParser.parseJsonFormat(js, operation).map(_._1) }

      if (skipGraphOperation) Future.successful(Json.toJson(edges))
      else {
        graph.mutateEdges(adEdges, withWait = true).map { _ =>
          Json.toJson(edges)
        }
      }
    }
  }