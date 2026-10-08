/**
 * 사이트마다 바뀌는 값 (2026-10-08). 실제 값은 저장소 맨 위 site.config.json 한 곳에 있습니다.
 *
 * 같은 틀로 다른 사이트를 만들 때 고칠 곳을 줄이려고 모았습니다. 도메인·브랜드명·세계관 이름·상품 가격·판매자 정보를
 * 코드 안에 다시 적지 말고 여기서 가져다 쓰세요. 파이썬·mjs 스크립트는 JSON 을 직접 읽습니다.
 */
import config from "../site.config.json";

export const SITE = config.brand;
export const SITE_DOMAIN = config.brand.domain;
export const SITE_ORIGIN = `https://${config.brand.domain}`;
export const SITE_NAME = config.brand.name;

export const WORLD = config.world;
export const PRODUCT = config.product;
export const PAYMENT = config.payment;
export const SELLER_INFO = config.seller;

/** 절대 주소. path 는 "/" 로 시작합니다. */
export const absUrl = (path: string) => `${SITE_ORIGIN}${path}`;
